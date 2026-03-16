import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Upload, Droplets, Loader2, AlertTriangle, Info, FlaskConical, Printer, Download } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface WaterResult {
  pollution: number;
  turbidity: number;
  safety: number;
  ph_level: number;
  pollutants: { name: string; level: number; risk: "low" | "medium" | "high" }[];
  reasons: string;
  details: string;
}

const WaterAnalysis = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<WaterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setImage(reader.result as string); setResult(null); setError(null); };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true); setError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) { toast.error("Gemini API key not configured."); return; }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const base64Data = image.split(",")[1];
      const prompt = `Analyze this water image for a formal laboratory report. Return strictly as JSON:
- "pollution": number (0-100 contamination score)
- "turbidity": number (0-100 cloudiness)
- "safety": number (0-100 safety score)
- "ph_level": number (1.0-14.0)
- "pollutants": array of { "name": string, "level": number (0-100), "risk": "low"|"medium"|"high" }
- "reasons": string (one-sentence executive summary)
- "details": string (detailed scientific breakdown)
No markdown or code blocks.`;
      const res = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }]);
      const text = res.response.text().trim().replace(/```json|```/g, "").trim();
      setResult(JSON.parse(text));
      toast.success("Analysis complete.");
    } catch (e: any) {
      setError(e.message ?? "Analysis failed.");
      toast.error("Analysis failed. Check your API key and image.");
    } finally { setAnalyzing(false); }
  };

  const metricBar = (value: number, invert = false) => {
    const high = invert ? value < 30 : value > 70;
    const mid  = invert ? value < 60 : value > 40;
    return high ? "bg-red-600" : mid ? "bg-amber-500" : "bg-green-600";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-blue-500/20 p-4 rounded-2xl shadow-inner border border-blue-500/30">
            <Droplets className="h-10 w-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Water Intelligence Lab
            </h1>
            <p className="text-blue-400/60 text-sm font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
              <FlaskConical className="h-4 w-4" /> AI-Powered Water Quality Analysis
            </p>
          </div>
        </div>
      </header>

      {/* Input Section */}
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-[#111] border-blue-500/10 rounded-3xl overflow-hidden shadow-2xl hover:border-blue-500/30 transition-colors">
          <CardHeader className="border-b border-blue-500/10 bg-blue-500/5 p-6">
            <CardTitle className="text-xl flex items-center gap-3 font-bold text-blue-400 uppercase tracking-tight">
              <Upload className="h-5 w-5" /> Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <Label className="text-sm font-black uppercase tracking-widest text-blue-400/70">
                Water Sample Image
              </Label>
              <Label
                htmlFor="water-upload"
                className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-blue-500/10 rounded-3xl bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer hover:border-blue-500/50 group"
              >
                {image
                  ? <img src={image} alt="preview" className="max-h-44 mx-auto rounded-2xl object-contain" />
                  : <>
                      <Droplets className="w-12 h-12 mb-4 text-blue-400/30 group-hover:text-blue-400 transition-all group-hover:scale-110" />
                      <p className="mb-2 text-sm text-blue-300 font-bold">UPLOAD WATER SAMPLE IMAGE</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Supports JPG, PNG, WEBP (MAX. 10MB)</p>
                    </>
                }
                <Input id="water-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </Label>
            </div>

            <Button
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              onClick={analyzeImage}
              disabled={!image || analyzing}
            >
              {analyzing
                ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" />Processing Sample…</>
                : <><Brain className="mr-3 h-6 w-6" />Run Deep Analysis</>}
            </Button>

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-start gap-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <p>AI analysis is for preliminary screening only. High-precision results require clinical laboratory testing.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Section */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {analyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-[#111]/50 border-2 border-dashed border-blue-500/10 rounded-[3rem]"
            >
              <Loader2 className="h-16 w-16 text-blue-400 animate-spin mb-6" />
              <p className="text-lg font-bold uppercase tracking-widest text-blue-400/60">Analyzing Sample…</p>
            </motion.div>
          )}

          {!result && !analyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-[#111]/50 border-2 border-dashed border-blue-500/5 rounded-[3rem]"
            >
              <div className="relative mb-10">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full"
                />
                <div className="relative bg-blue-500/10 rounded-full p-12 ring-1 ring-blue-500/20 backdrop-blur-3xl shadow-2xl">
                  <Brain className="h-20 w-20 text-blue-400" />
                </div>
              </div>
              <h3 className="text-3xl font-black mb-3 text-white uppercase tracking-tighter italic">Systems Ready for Input</h3>
              <p className="max-w-md text-base leading-relaxed text-blue-400/40 font-medium">
                Upload a water sample image to initialize the neural analysis engine.
              </p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Headline stats */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: "Contamination", value: `${result.pollution}%`, color: result.pollution > 70 ? "text-red-400" : result.pollution > 40 ? "text-orange-400" : "text-green-400" },
                  { label: "Turbidity",     value: `${result.turbidity}%`, color: result.turbidity > 70 ? "text-red-400" : result.turbidity > 40 ? "text-orange-400" : "text-green-400" },
                  { label: "Safety Score",  value: `${result.safety}%`,   color: result.safety > 70 ? "text-green-400" : result.safety > 40 ? "text-orange-400" : "text-red-400" },
                  { label: "pH Level",      value: `${result.ph_level}`,  color: "text-blue-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
                    <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Formal report document */}
              <div className="bg-white text-[#0A0A0A] rounded-[2rem] shadow-2xl overflow-hidden border-[16px] border-neutral-900 flex flex-col md:flex-row min-h-[700px] print:border-none print:shadow-none">
                {/* Sidebar */}
                <div className="md:w-72 bg-neutral-50 border-r border-neutral-200 p-8 flex flex-col justify-between">
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">Batch ID</p>
                      <p className="text-sm font-mono font-bold">#{Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">Date Scanned</p>
                      <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Detected Pollutants</p>
                      <div className="space-y-3">
                        {result.pollutants.map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white border border-neutral-100 rounded-lg">
                            <div>
                              <p className="text-xs font-black">{p.name}</p>
                              <p className={`text-[9px] font-bold uppercase ${p.risk === "high" ? "text-red-600" : p.risk === "medium" ? "text-amber-600" : "text-green-600"}`}>
                                {p.risk} risk
                              </p>
                            </div>
                            <p className="text-sm font-black">{p.level}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-neutral-200">
                    <div className="bg-neutral-900 p-4 rounded-xl text-white">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-2">Final Verdict</p>
                      <p className="text-xs font-bold leading-tight">
                        {result.safety > 80
                          ? "Potable — Safe for consumption after standard filtration."
                          : result.safety > 50
                          ? "Restricted — Industrial use only. Avoid ingestion."
                          : "Hazardous — Toxic indicators detected. Stay clear."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main body */}
                <div className="flex-1 p-12 relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-[2.5] rotate-[15deg]">
                    <Droplets className="h-96 w-96 text-neutral-900" />
                  </div>

                  <div className="relative z-10 space-y-10">
                    <header className="flex justify-between items-start border-b-4 border-neutral-900 pb-8">
                      <div>
                        <div className="bg-neutral-900 text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.4em] inline-block mb-4">
                          Official AI Laboratory Report
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">
                          Certificate<br />of Analysis
                        </h2>
                        <p className="text-sm font-bold text-neutral-500 mt-3">NEMAP ENVIRONMENTAL INTELLIGENCE LABORATORY</p>
                      </div>
                      <div className={`px-6 py-2 border-4 font-black uppercase tracking-tighter rotate-[-5deg] text-xl ${result.safety > 70 ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}`}>
                        {result.safety > 70 ? "CERTIFIED SAFE" : "FAIL — TOXIC"}
                      </div>
                    </header>

                    {/* Core metrics */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 border-b border-neutral-100 pb-2">Core Metrics</h3>
                      {[
                        { label: "Contamination Index", value: result.pollution },
                        { label: "Optical Turbidity",   value: result.turbidity },
                        { label: "Biological Safety",   value: result.safety, invert: true },
                      ].map(({ label, value, invert }) => (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                            <span>{label}</span><span>{value}%</span>
                          </div>
                          <div className="h-2 w-full bg-neutral-100 overflow-hidden">
                            <div className={`h-full ${metricBar(value, invert)}`} style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}

                      <div className="p-6 bg-neutral-900 text-white flex items-center justify-between rounded-none">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">pH Level</span>
                        <span className="text-4xl font-black">{result.ph_level}</span>
                      </div>
                    </div>

                    {/* Analyst remarks */}
                    <div className="space-y-4 pt-8 border-t border-neutral-100">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400">Chief Analyst Remarks</h3>
                      <p className="text-sm font-medium leading-relaxed italic text-neutral-600">"{result.reasons}"</p>
                      <p className="text-xs text-neutral-500 leading-relaxed font-light">{result.details}</p>
                    </div>

                    <footer className="pt-10 border-t border-neutral-100 flex flex-wrap gap-4 no-print">
                      <Button
                        className="bg-neutral-900 hover:bg-neutral-800 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:-translate-y-1"
                        onClick={() => window.print()}
                      >
                        <Printer className="mr-3 h-4 w-4" /> Print Report
                      </Button>
                      <Button
                        variant="outline"
                        className="border-4 border-neutral-900 text-neutral-900 px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50 transition-all hover:-translate-y-1"
                      >
                        <Download className="mr-3 h-4 w-4" /> Archive Report
                      </Button>
                    </footer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WaterAnalysis;
