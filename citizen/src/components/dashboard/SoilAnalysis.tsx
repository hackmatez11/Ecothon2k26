import { useState, useRef, useCallback } from "react";

// ─── ENV KEYS ────────────────────────────────────────────────────────────────
const ENV_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const ENV_TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY || "";
const TAVILY_AVAILABLE = !!ENV_TAVILY_KEY && ENV_TAVILY_KEY.trim().length > 0;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FILE_ICONS: Record<string, string> = { PDF: "📑", PNG: "🖼️", JPG: "🖼️", JPEG: "🖼️", TXT: "📝", DOCX: "📄", CSV: "📊" };
const getFileIcon = (ext?: string) => FILE_ICONS[ext?.toUpperCase() ?? ""] || "📄";

async function readFileContent(file: File) {
  return new Promise<{ type: string; data: string; mimeType?: string; name: string }>((resolve) => {
    if (file.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = (e) => resolve({ type: "image", data: (e.target!.result as string).split(",")[1], mimeType: file.type, name: file.name });
      r.readAsDataURL(file);
    } else {
      const r = new FileReader();
      r.onload = (e) => resolve({ type: "text", data: e.target!.result as string, name: file.name });
      r.onerror = () => resolve({ type: "text", data: "", name: file.name });
      r.readAsText(file);
    }
  });
}

async function callGroq(apiKey: string, fileContents: any[], location: string) {
  const textParts = fileContents.filter((f) => f.type === "text").map((f) => `--- File: ${f.name} ---\n${f.data}`).join("\n\n");
  const imageParts = fileContents.filter((f) => f.type === "image");
  let userContent = "";
  if (textParts) userContent += `SOIL DOCUMENTS:\n${textParts}\n\n`;
  if (imageParts.length) userContent += `[${imageParts.length} soil image(s) attached: ${imageParts.map((i) => i.name).join(", ")}]\n\n`;
  userContent += `Farm Location: ${location}`;
  const messages = [
    {
      role: "system",
      content: `You are an expert agronomist and soil scientist. Analyze the provided soil report data and return a JSON object (no markdown, no code blocks, raw JSON only) with exactly this structure:
{"soilType":"string","ph":"string","phStatus":"good|low|high","organicMatter":"string","organicMatterStatus":"good|low|high","nitrogen":"string","nitrogenStatus":"good|low|high","phosphorus":"string","phosphorusStatus":"good|low|high","potassium":"string","potassiumStatus":"good|low|high","texture":"string","drainage":"string","salinity":"string","salinityStatus":"good|low|high","summary":"string","deficiencies":"string","improvements":"string","concerns":"string","overallScore":"number 1-10"}`,
    },
    { role: "user", content: userContent },
  ];
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "meta-llama/llama-4-scout-17b-16e-instruct", messages, max_tokens: 1500, temperature: 0.3 }),
  });
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(`Groq API error: ${(err as any).error?.message || response.statusText}`); }
  const data = await response.json();
  const raw = data.choices[0].message.content.trim();
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { return { summary: raw, soilType: "Analyzed", overallScore: 7 }; }
}

async function callTavily(apiKey: string, location: string, soilType: string) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query: `agriculture crops suitable for ${location} climate soil geography farming`, search_depth: "advanced", max_results: 6, include_answer: true, include_raw_content: false }),
  });
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(`Tavily API error: ${(err as any).detail || response.statusText}`); }
  const data = await response.json();
  return { answer: data.answer || "", results: (data.results || []).slice(0, 5).map((r: any) => ({ title: r.title, content: r.content?.slice(0, 300) || "", url: r.url })) };
}

async function callGroqFinal(apiKey: string, soilData: any, tavilyData: any, location: string) {
  const soilSummary = JSON.stringify(soilData, null, 2);
  const geoContext = tavilyData.answer + "\n\n" + tavilyData.results.map((r: any) => `${r.title}: ${r.content}`).join("\n");
  const messages = [
    {
      role: "system",
      content: `You are an expert agronomist. Based on soil analysis data and geographic/web research, provide detailed crop recommendations. Return a JSON object (raw JSON only, no markdown) with:
{"geoSummary":{"climate":"string","rainfallPattern":"string","growingSeason":"string","averageTemp":"string","elevation":"string"},"crops":[{"name":"string","emoji":"single emoji","suitabilityScore":"number 1-100","isTopPick":"boolean","season":"string","reason":"string","expectedYield":"string","marketValue":"string","waterRequirement":"string"}],"generalAdvice":"string","soilAmendmentPlan":"string","warnings":"string"}`,
    },
    { role: "user", content: `Location: ${location}\n\nSOIL ANALYSIS:\n${soilSummary}\n\nGEOGRAPHIC RESEARCH:\n${geoContext}\n\nProvide 6-8 crop recommendations ranked by suitability.` },
  ];
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "meta-llama/llama-4-scout-17b-16e-instruct", messages, max_tokens: 2000, temperature: 0.4 }),
  });
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(`Groq API error (final): ${(err as any).error?.message || response.statusText}`); }
  const data = await response.json();
  const raw = data.choices[0].message.content.trim();
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { return { generalAdvice: raw, crops: [], geoSummary: {}, _raw: raw }; }
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    good: { bg: "#f0faf4", color: "#2d7a4f", label: "✓ Good" },
    low:  { bg: "#fff8f0", color: "#b85c00", label: "↓ Low"  },
    high: { bg: "#fff0f0", color: "#c0392b", label: "↑ High" },
  };
  const c = cfg[status] || cfg.good;
  return <span style={{ background: c.bg, color: c.color, fontSize: 11, padding: "2px 9px", borderRadius: 100, fontWeight: 600, fontFamily: "monospace" }}>{c.label}</span>;
};

const MetricTile = ({ label, value, status }: { label: string; value: string; status: string }) => (
  <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "18px 16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s, transform 0.2s" }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1a2233", fontFamily: "'Georgia', serif", marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 11, color: "#8a97a8", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "monospace", marginBottom: 8 }}>{label}</div>
    <StatusBadge status={status || "good"} />
  </div>
);

const CropCard = ({ crop }: { crop: any }) => (
  <div style={{ background: crop.isTopPick ? "#fffbf0" : "#fff", border: `1px solid ${crop.isTopPick ? "#f0c060" : "#e8ecf0"}`, borderRadius: 16, padding: 20, textAlign: "center", boxShadow: crop.isTopPick ? "0 2px 12px rgba(240,192,96,0.18)" : "0 1px 4px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s" }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = crop.isTopPick ? "0 2px 12px rgba(240,192,96,0.18)" : "0 1px 4px rgba(0,0,0,0.06)"; }}>
    {crop.isTopPick && <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", color: "#b8860b", marginBottom: 8, fontWeight: 700 }}>⭐ Top Pick</div>}
    <div style={{ fontSize: 32, marginBottom: 10 }}>{crop.emoji || "🌿"}</div>
    <div style={{ fontFamily: "'Georgia', serif", fontSize: "1.05rem", fontWeight: 700, color: "#1a2233", marginBottom: 6 }}>{crop.name}</div>
    <div style={{ fontSize: 12, color: "#6b7a8d", lineHeight: 1.55, marginBottom: 10 }}>{crop.reason}</div>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0faf4", color: "#2d7a4f", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>Match <strong>{crop.suitabilityScore}%</strong></div>
    {crop.season && <div style={{ fontSize: 11, color: "#8a97a8", marginTop: 6 }}>📅 {crop.season}</div>}
    {crop.waterRequirement && <div style={{ fontSize: 11, color: "#8a97a8" }}>💧 {crop.waterRequirement}</div>}
  </div>
);

const GeoTile = ({ label, value }: { label: string; value: string }) => (
  <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
    <div style={{ fontSize: 11, color: "#8a97a8", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "monospace", marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 14, color: "#1a2233", lineHeight: 1.5 }}>{value}</div>
  </div>
);

const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 20, marginBottom: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
    <div style={{ padding: "18px 28px", borderBottom: "1px solid #f0f4f8", display: "flex", alignItems: "center", gap: 12, background: "#fafbfc" }}>
      <div style={{ fontSize: 22, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff", borderRadius: 10 }}>{icon}</div>
      <div style={{ fontFamily: "'Georgia', serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a2233" }}>{title}</div>
    </div>
    <div style={{ padding: 28 }}>{children}</div>
  </div>
);

const StepCard = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 20, padding: 32, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 3, color: "#4a7c59", background: "#edf7f0", border: "1px solid #b8dfc7", padding: "4px 10px", borderRadius: 100, textTransform: "uppercase" }}>{num}</span>
      <span style={{ fontFamily: "'Georgia', serif", fontSize: "1.2rem", fontWeight: 700, color: "#1a2233" }}>{title}</span>
    </div>
    {children}
  </div>
);

const ProgressStep = ({ icon, label, sub, state }: { icon: string; label: string; sub: string; state: string }) => {
  const colors: Record<string, string> = { idle: "#d0d7df", active: "#4a7c59", done: "#2d9e5f" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", opacity: state === "idle" ? 0.4 : 1, transition: "opacity 0.4s" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, border: `2px solid ${colors[state]}`, background: state === "active" ? "#edf7f0" : state === "done" ? "#d4f5e5" : "#f5f7fa", position: "relative" }}>
        {state === "done" ? "✅" : icon}
        {state === "active" && <span style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#4a7c59", animation: "spin 1s linear infinite" }} />}
      </div>
      <div>
        <div style={{ fontSize: 14, color: "#1a2233", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#8a97a8", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function SoilAnalysis() {
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState("");
  const groqKey = ENV_GROQ_KEY;
  const tavilyKey = ENV_TAVILY_KEY;
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"input" | "progress" | "results">("input");
  const [progressStep, setProgressStep] = useState("parse");
  const [results, setResults] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STEPS = TAVILY_AVAILABLE ? ["parse", "groq", "tavily", "reco"] : ["parse", "groq", "reco"];
  const stepState = (id: string) => {
    const myIdx = STEPS.indexOf(id);
    const curIdx = STEPS.indexOf(progressStep);
    if (myIdx === curIdx) return "active";
    if (myIdx < curIdx) return "done";
    return "idle";
  };

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => {
      const next = [...prev];
      for (const f of Array.from(incoming)) {
        if (!next.find((u) => u.name === f.name && u.size === f.size)) next.push(f);
      }
      return next;
    });
  }, []);

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const autoLocate = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      const { latitude: lat, longitude: lon } = pos.coords;
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const d = await r.json();
      const parts = [d.address?.city || d.address?.town || d.address?.village, d.address?.state, d.address?.country].filter(Boolean);
      setLocation(parts.join(", "));
    } catch { setError("Could not auto-detect location. Please type manually."); }
    setLocating(false);
  };

  const runAnalysis = async () => {
    setError("");
    if (!location.trim()) { setError("Please enter your farm location."); return; }
    if (files.length === 0) { setError("Please upload at least one soil report or photo."); return; }
    setView("progress"); setProgressStep("parse");
    try {
      const fileContents = await Promise.all(files.map(readFileContent));
      await delay(500); setProgressStep("groq");
      const soilData = await callGroq(groqKey, fileContents, location);
      let tavilyData = { answer: "", results: [] };
      if (TAVILY_AVAILABLE) {
        await delay(400); setProgressStep("tavily");
        tavilyData = await callTavily(tavilyKey, location, soilData.soilType || "general");
      }
      await delay(400); setProgressStep("reco");
      const finalData = await callGroqFinal(groqKey, soilData, tavilyData, location);
      await delay(500);
      setResults({ soil: soilData, tavily: tavilyData, final: finalData });
      setView("results");
    } catch (err: any) {
      setView("input");
      setError(err.message || "An unexpected error occurred. Check your API keys and try again.");
    }
  };

  const reset = () => { setView("input"); setFiles([]); setResults(null); setError(""); setShowRaw(false); };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px 13px 44px", background: "#fff", border: "1.5px solid #dce3ea", borderRadius: 12, color: "#1a2233", fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" };
  const btnPrimary: React.CSSProperties = { width: "100%", padding: "17px", background: "linear-gradient(135deg, #4a7c59 0%, #2d5e40 100%)", border: "none", borderRadius: 16, color: "#fff", fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 700, cursor: "pointer", letterSpacing: 0.4, marginTop: 24, boxShadow: "0 4px 20px rgba(74,124,89,0.3)", transition: "transform 0.2s, box-shadow 0.2s" };

  const metrics = results ? [
    { label: "pH Level", value: results.soil.ph || "N/A", status: results.soil.phStatus },
    { label: "Organic Matter", value: results.soil.organicMatter || "N/A", status: results.soil.organicMatterStatus },
    { label: "Nitrogen (N)", value: results.soil.nitrogen || "N/A", status: results.soil.nitrogenStatus },
    { label: "Phosphorus (P)", value: results.soil.phosphorus || "N/A", status: results.soil.phosphorusStatus },
    { label: "Potassium (K)", value: results.soil.potassium || "N/A", status: results.soil.potassiumStatus },
    { label: "Salinity (EC)", value: results.soil.salinity || "N/A", status: results.soil.salinityStatus },
    { label: "Soil Texture", value: results.soil.texture || "N/A", status: "good" },
    { label: "Overall Score", value: `${results.soil.overallScore || "N/A"}/10`, status: results.soil.overallScore >= 7 ? "good" : "low" },
  ] : [];

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } * { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <header style={{ textAlign: "center", padding: "56px 0 44px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 46, height: 46, background: "linear-gradient(135deg, #4a7c59, #2d9e5f)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 16px rgba(74,124,89,0.3)" }}>🌱</div>
            <span style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#4a7c59", fontWeight: 600 }}>SoilSense</span>
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, color: "#1a2233", marginBottom: 12, lineHeight: 1.1 }}>Intelligent Soil Analysis</h1>
          <p style={{ color: "#6b7a8d", fontSize: 15, fontWeight: 400 }}>Upload your soil report · Enter your location · Get AI-powered crop recommendations</p>
          <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, transparent, #4a7c59, transparent)", margin: "28px auto 0" }} />
        </header>

        {view === "input" && (
          <>
            <StepCard num="Step 01" title="Upload Soil Report or Photos">
              <div style={{ border: `2px dashed ${dragOver ? "#4a7c59" : "#b8d4c4"}`, borderRadius: 16, padding: "44px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#f0faf4" : "#fafcfa", transition: "all 0.2s" }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.doc,.docx,.csv" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
                <div style={{ fontSize: 38, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1a2233", marginBottom: 5 }}>Drop files here or click to browse</div>
                <div style={{ fontSize: 13, color: "#8a97a8" }}>Upload soil test reports, lab documents, or field photos</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {["JPG / PNG", "PDF", "TXT", "DOCX", "CSV"].map((t) => (<span key={t} style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 1, padding: "3px 10px", borderRadius: 100, border: "1px solid #b8d4c4", color: "#6b7a8d", background: "#f0faf4" }}>{t}</span>))}
                </div>
              </div>
              {files.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "#f0faf4", border: "1px solid #b8d4c4", borderRadius: 100, fontSize: 13, color: "#1a2233" }}>
                      <span>{getFileIcon(f.name.split(".").pop())}</span>
                      <span>{f.name}</span>
                      <span style={{ color: "#8a97a8", fontSize: 11 }}>({(f.size / 1024).toFixed(1)}KB)</span>
                      <span onClick={() => removeFile(i)} style={{ cursor: "pointer", color: "#c0392b", fontSize: 16, lineHeight: "1", marginLeft: 2 }}>×</span>
                    </div>
                  ))}
                </div>
              )}
            </StepCard>
            <StepCard num="Step 02" title="Your Farm Location">
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>📍</span>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nashik, Maharashtra, India" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "#4a7c59"; e.target.style.boxShadow = "0 0 0 3px rgba(74,124,89,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#dce3ea"; e.target.style.boxShadow = "none"; }} />
                </div>
                <button onClick={autoLocate} disabled={locating} style={{ padding: "13px 18px", background: "#fff", border: "1.5px solid #b8d4c4", borderRadius: 12, color: "#4a7c59", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f0faf4"; e.currentTarget.style.borderColor = "#4a7c59"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#b8d4c4"; }}>
                  📡 {locating ? "Detecting…" : "Auto-detect"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#8a97a8", display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, lineHeight: 1.5 }}>
                <span>ℹ️</span><span>Your location is used to research local climate, geography, and find the most suitable crops for your region.</span>
              </div>
            </StepCard>

            {error && <div style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 12, padding: "14px 18px", color: "#c0392b", fontSize: 14, marginBottom: 8 }}>⚠️ {error}</div>}
            <button style={btnPrimary} onClick={runAnalysis}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(74,124,89,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(74,124,89,0.3)"; }}>
              🔬 Analyse Soil &amp; Recommend Crops
            </button>
          </>
        )}

        {view === "progress" && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 20, padding: "28px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: "1.2rem", color: "#1a2233", marginBottom: 4 }}>Analysing your soil…</div>
                <div style={{ fontSize: 13, color: "#8a97a8" }}>This may take 15–30 seconds depending on file size.</div>
              </div>
              <ProgressStep icon="📄" label="Reading your files" sub="Extracting soil data from uploaded documents" state={stepState("parse")} />
              <ProgressStep icon="🧠" label="Groq AI Analysis" sub="Running deep soil chemistry analysis" state={stepState("groq")} />
              {TAVILY_AVAILABLE && <ProgressStep icon="🌍" label="Geographic Research" sub="Searching climate, soil zones & crop suitability for your region" state={stepState("tavily")} />}
              <ProgressStep icon="🌾" label="Generating Recommendations" sub="Matching soil profile to optimal crops" state={stepState("reco")} />
            </div>
          </div>
        )}

        {view === "results" && results && (
          <div style={{ marginTop: 20, animation: "fadeUp 0.6s ease" }}>
            <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", background: "#fff", border: "1px solid #b8d4c4", borderRadius: 12, color: "#4a7c59", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 20, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0faf4"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
              ← New Analysis
            </button>
            <Section icon="🧪" title="Soil Analysis Report">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
                {metrics.map((m) => <MetricTile key={m.label} {...m} />)}
              </div>
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e8ecf0, transparent)", margin: "20px 0" }} />
              <div style={{ fontSize: 14.5, lineHeight: 1.85, color: "#3a4a5a" }}>
                {results.soil.summary && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", margin: "0 0 8px" }}>📊 Soil Summary</h3><p style={{ marginBottom: 16 }}>{results.soil.summary}</p></>}
                {results.soil.deficiencies && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", margin: "0 0 8px" }}>⚠️ Deficiencies Detected</h3><p style={{ marginBottom: 16 }}>{results.soil.deficiencies}</p></>}
                {results.soil.improvements && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", margin: "0 0 8px" }}>🔧 Recommended Improvements</h3><p style={{ marginBottom: 16 }}>{results.soil.improvements}</p></>}
                {results.soil.concerns && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", margin: "0 0 8px" }}>🚨 Concerns</h3><p style={{ marginBottom: 16 }}>{results.soil.concerns}</p></>}
                <h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", margin: "0 0 8px" }}>🏔️ Soil Type</h3>
                <p>{results.soil.soilType || "Not determined"} — Drainage: {results.soil.drainage || "Not specified"}</p>
              </div>
            </Section>

            <Section icon="🗺️" title="Geographic & Climate Context">
              {results.final.geoSummary && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Climate Type", value: results.final.geoSummary.climate },
                    { label: "Rainfall Pattern", value: results.final.geoSummary.rainfallPattern },
                    { label: "Growing Season", value: results.final.geoSummary.growingSeason },
                    { label: "Average Temperature", value: results.final.geoSummary.averageTemp },
                  ].map((g) => g.value && <GeoTile key={g.label} label={g.label} value={g.value} />)}
                </div>
              )}
              {TAVILY_AVAILABLE && results.tavily?.answer && (
                <div style={{ fontSize: 14.5, lineHeight: 1.85, color: "#3a4a5a" }}>
                  <h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", marginBottom: 8 }}>🌐 Regional Research</h3>
                  <p>{results.tavily.answer}</p>
                  {results.tavily.results?.length > 0 && (
                    <p style={{ marginTop: 12 }}>
                      <strong>Sources: </strong>
                      {results.tavily.results.map((r: any, i: number) => (
                        <span key={i}>{i > 0 && " · "}<a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#4a7c59", textDecoration: "none" }}>{r.title}</a></span>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </Section>
            <Section icon="🌾" title="Recommended Crops">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
                {(results.final.crops || []).map((c: any, i: number) => <CropCard key={i} crop={c} />)}
              </div>
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e8ecf0, transparent)", margin: "24px 0" }} />
              <div style={{ fontSize: 14.5, lineHeight: 1.85, color: "#3a4a5a" }}>
                {results.final.generalAdvice && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", marginBottom: 8 }}>🧭 Farming Strategy</h3><p style={{ marginBottom: 16 }}>{results.final.generalAdvice}</p></>}
                {results.final.soilAmendmentPlan && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", marginBottom: 8 }}>🧪 Soil Amendment Plan</h3><p style={{ marginBottom: 16 }}>{results.final.soilAmendmentPlan}</p></>}
                {results.final.warnings && <><h3 style={{ fontFamily: "'Georgia', serif", fontSize: "1rem", color: "#1a2233", marginBottom: 8 }}>⚠️ Important Cautions</h3><p>{results.final.warnings}</p></>}
              </div>
              <div style={{ marginTop: 20 }}>
                <button onClick={() => setShowRaw(p => !p)} style={{ background: "none", border: "1px solid #dce3ea", color: "#8a97a8", fontSize: 12, fontFamily: "monospace", letterSpacing: 1, padding: "6px 14px", borderRadius: 100, cursor: "pointer", transition: "all 0.2s" }}>
                  {showRaw ? "HIDE" : "VIEW"} RAW RESPONSE
                </button>
                {showRaw && results.final._raw && (
                  <pre style={{ marginTop: 12, background: "#f5f7fa", border: "1px solid #e8ecf0", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#6b7a8d", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 300, overflowY: "auto" }}>{results.final._raw}</pre>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

export default SoilAnalysis;
