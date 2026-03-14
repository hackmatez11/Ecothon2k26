import { supabase } from "./supabase";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface Officer {
  id: string;
  name: string;
  designation: string;
  work_domain: string;
  email: string;
}

interface Complaint {
  id: string;
  description: string;
  department: string;
  severity: string;
  ai_analysis?: string;
  location?: string;
}

interface AssignmentResult {
  officerId: string;
  officerName: string;
  reason: string;
}

/**
 * Use Groq AI to intelligently assign a complaint to the most suitable officer
 */
export async function assignComplaintToOfficer(
  complaint: Complaint
): Promise<AssignmentResult | null> {
  try {
    const mappedDept = mapDepartmentKey(complaint.department);

    // Fetch all active officers from the complaint's department
    const { data: officers, error: officersError } = await supabase
      .from("officers")
      .select("id, name, designation, work_domain, email")
      .eq("department", mappedDept)
      .eq("is_active", true);

    if (officersError) throw officersError;
    
    if (!officers || officers.length === 0) {
      console.warn(`No officers found for department: ${complaint.department} (mapped: ${mappedDept})`);
      return null;
    }

    // Use Groq AI to select the best officer (falls back to first officer if unavailable)
    const assignment = await selectOfficerWithGroq(complaint, officers);
    
    if (!assignment) return null;

    // Update the complaint with the assigned officer
    const { error: updateError } = await supabase
      .from("complaints")
      .update({
        assigned_officer_id: assignment.officerId,
        assigned_officer_name: assignment.officerName,
        assignment_reason: assignment.reason,
        status: "assigned"
      })
      .eq("id", complaint.id);

    if (updateError) throw updateError;

    return assignment;
  } catch (error) {
    console.error("Error assigning complaint to officer:", error);
    return null;
  }
}

/**
 * Call Groq API to intelligently match complaint to officer
 */
async function selectOfficerWithGroq(
  complaint: Complaint,
  officers: Officer[]
): Promise<AssignmentResult | null> {
  // If no Groq key, skip AI and use smart domain-matching fallback
  if (!GROQ_API_KEY) {
    console.warn("No GROQ_API_KEY set — using domain-matching fallback");
    return domainMatchFallback(complaint, officers);
  }

  try {
    const prompt = `You are an intelligent task assignment system for a government environmental department.

COMPLAINT DETAILS:
- Description: ${complaint.description}
- Department: ${complaint.department}
- Severity: ${complaint.severity}
- AI Analysis: ${complaint.ai_analysis || "N/A"}
- Location: ${complaint.location || "N/A"}

AVAILABLE OFFICERS:
${officers.map((o, idx) => `${idx + 1}. Name: ${o.name}
   Designation: ${o.designation}
   Work Domain: ${o.work_domain}
   Email: ${o.email}`).join("\n\n")}

TASK:
Analyze the complaint and select the MOST SUITABLE officer to handle this case based on:
1. Officer's work domain relevance to the complaint nature
2. Officer's designation and expertise level
3. Severity of the complaint (high severity → senior officers)
4. Specific skills needed for this type of issue

Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "officerId": "<exact officer id from the list>",
  "officerName": "<exact officer name>",
  "reason": "<brief 1-2 sentence explanation of why this officer is the best match>"
}`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an expert task assignment AI. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from Groq API");
    }

    const result = JSON.parse(content);
    
    // Validate the result
    if (!result.officerId || !result.officerName || !result.reason) {
      throw new Error("Invalid response format from Groq API");
    }

    // Verify the officer exists in our list
    const selectedOfficer = officers.find(o => o.id === result.officerId);
    if (!selectedOfficer) {
      // Fallback: use first officer if AI selected invalid ID
      console.warn("AI selected invalid officer ID, using first available officer");
      return {
        officerId: officers[0].id,
        officerName: officers[0].name,
        reason: "Automatically assigned to available officer"
      };
    }

    return result;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return domainMatchFallback(complaint, officers);
  }
}

/**
 * Fallback: pick the officer whose work_domain best matches the complaint description.
 * Scores by counting keyword overlaps, then falls back to first officer.
 */
function domainMatchFallback(complaint: Complaint, officers: Officer[]): AssignmentResult {
  const text = `${complaint.description} ${complaint.ai_analysis ?? ""}`.toLowerCase();

  let best = officers[0];
  let bestScore = 0;

  for (const officer of officers) {
    const domainWords = officer.work_domain.toLowerCase().split(/\s+/);
    const score = domainWords.filter(word => word.length > 3 && text.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      best = officer;
    }
  }

  return {
    officerId: best.id,
    officerName: best.name,
    reason: `Auto-assigned based on work domain match (${best.work_domain}).`,
  };
}

/**
 * Map department keys from citizen app to government app format
 */
function mapDepartmentKey(deptKey: string): string {
  const mapping: Record<string, string> = {
    "environment": "environment",
    "water": "water_resources",
    "pollution": "industrial_regulation",
    "agriculture": "agricultural",
    "waste": "waste",
    "forest": "forest",
    "soil": "soil_conservation"
  };
  
  return mapping[deptKey] || deptKey;
}
