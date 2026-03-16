import { supabase } from "./supabase";
import { sendResolutionPlanEmail } from "./emailService";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

export interface ResolutionStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  responsible: string;
}

export interface ResolutionPlan {
  summary: string;
  steps: ResolutionStep[];
  expected_timeline: string;
  resources_needed: string[];
  references: { title: string; url: string }[];
  initial_score: number;
  target_score: number;
}

/** Search Tavily for real-world resolution approaches */
async function searchTavily(query: string): Promise<{ title: string; url: string; content: string }[]> {
  if (!TAVILY_API_KEY) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: 4,
        include_answer: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content?.slice(0, 400) ?? "",
    }));
  } catch {
    return [];
  }
}

/** Use Groq to synthesize a structured resolution plan */
async function generatePlanWithGroq(
  complaint: {
    description: string;
    department: string;
    severity: string;
    location: string;
    ai_analysis: string;
    image_url?: string;
  },
  webContext: string
): Promise<ResolutionPlan> {
  const messages: any[] = [
    {
      role: "system",
      content:
        "You are a senior government environmental officer. Generate detailed, actionable resolution plans for environmental complaints. Always respond with valid JSON only.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Generate a resolution plan for this environmental complaint.

COMPLAINT DETAILS:
- Description: ${complaint.description}
- Department: ${complaint.department}
- Severity: ${complaint.severity}
- Location: ${complaint.location || "Not specified"}
- AI Analysis: ${complaint.ai_analysis || "N/A"}

WEB RESEARCH CONTEXT (use this to inform best practices):
${webContext || "No web context available."}

${complaint.image_url ? "An image of the issue is attached." : ""}

Respond with ONLY this JSON structure:
{
  "summary": "<2-3 sentence executive summary of the resolution approach>",
  "steps": [
    {
      "step": 1,
      "title": "<step title>",
      "description": "<detailed action description>",
      "duration": "<e.g. 1-2 days>",
      "responsible": "<e.g. Field Inspector, Lab Team>"
    }
  ],
  "expected_timeline": "<total expected resolution time, e.g. 7-14 days>",
  "resources_needed": ["<resource 1>", "<resource 2>"],
  "initial_score": <number 0-100 representing current pollution/impact level>,
  "target_score": <number 0-100 representing goal level after resolution>,
  "references": []
}

Include 4-6 concrete steps. Be specific to the complaint type and severity.`,
        },
        ...(complaint.image_url
          ? [{ type: "image_url", image_url: { url: complaint.image_url } }]
          : []),
      ],
    },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages,
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.statusText}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as ResolutionPlan;
}

/** Main entry: search web + generate plan + save to DB */
export async function generateAndSaveResolutionPlan(
  complaintId: string,
  complaint: {
    description: string;
    department: string;
    severity: string;
    location: string;
    ai_analysis: string;
    image_url?: string;
    assigned_officer_name?: string;
    citizen_email: string;
  }
): Promise<ResolutionPlan> {
  // 1. Web search for best practices
  const searchQuery = `${complaint.department} environmental complaint resolution ${complaint.description.slice(0, 80)} best practices India`;
  const webResults = await searchTavily(searchQuery);
  const webContext = webResults
    .map((r) => `[${r.title}]: ${r.content}`)
    .join("\n\n");

  // 2. Generate plan with Groq (vision + text)
  const plan = await generatePlanWithGroq(complaint, webContext);

  // Attach web references
  plan.references = webResults.map((r) => ({ title: r.title, url: r.url }));

  // 3. Save to Supabase
  const { error } = await supabase
    .from("complaints")
    .update({
      resolution_plan: plan.summary,
      resolution_steps: plan.steps,
      expected_timeline: plan.expected_timeline,
      plan_generated_at: new Date().toISOString(),
      plan_generated_by: complaint.assigned_officer_name ?? "Government Officer",
      status: "in_progress",
    })
    .eq("id", complaintId);

  if (error) throw new Error("Failed to save plan: " + error.message);

  // 4. Send email notification to citizen
  const actionStepsText = plan.steps
    .map(s => `• Step ${s.step}: ${s.title} - ${s.description} (${s.duration})`)
    .join('\n');

  await sendResolutionPlanEmail({
    citizen_email: complaint.citizen_email,
    complaint_id: complaintId,
    description: complaint.description,
    location: complaint.location || "Not specified",
    resolution_summary: plan.summary,
    action_steps: actionStepsText,
    expected_timeline: plan.expected_timeline,
    officer_name: complaint.assigned_officer_name || "Government Officer",
  });

  return plan;
}
