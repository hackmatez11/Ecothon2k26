import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Upload, Droplets, FlaskConical, Waves, Info, Loader2, Sparkles, AlertCircle, Download } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const WaterAnalysis = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    pollution: number;
    turbidity: number;
    safety: number;
    ph_level: number;
    pollutants: { name: string; level: number; risk: 'low' | 'medium' | 'high' }[];
    reasons: string;
    details: string;
  } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResults(null); // Clear previous results when new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      // Note: In a production app, the API key should be handled securely.
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error("Gemini API key not found in environment variables.");
        setAnalyzing(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Using the model requested by the user
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const base64Data = image.split(",")[1];
      const part = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      };

      const prompt = `Analyze this water image for a formal laboratory report. 
      Return the results strictly as a JSON object with the following keys:
      - "pollution": number (0-100 visbile contamination score)
      - "turbidity": number (0-100 cloudiness level)
      - "safety": number (0-100 overall safety/potability score)
      - "ph_level": number (1.0 - 14.0 pH value)
      - "pollutants": array of objects { "name": string, "level": number (0-100), "risk": "low"|"medium"|"high" } (e.g. Lead, Microplastics, Algae)
      - "reasons": string (one-sentence executive summary)
      - "details": string (detailed scientific breakdown of optical indicators)
      Do not include any markdown or code blocks.`;

      const result = await model.generateContent([prompt, part]);
      const response = await result.response;
      const text = response.text().trim();
      
      try {
        // Remove potential markdown code blocks if the AI included them
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const jsonResult = JSON.parse(cleanJson);
        setResults(jsonResult);
        toast.success("Analysis complete! Insights generated.");
      } catch (parseError) {
        console.error("Error parsing AI response:", text);
        toast.error("Received unexpected format from AI. Retrying may help.");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Analysis failed. Please verify your API key and image.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resultCards = [
    { title: "Contamination Index", icon: Droplets, color: "text-red-600", key: "pollution", border: "border-red-500/20" },
    { title: "Optical Turbidity", icon: Waves, color: "text-blue-600", key: "turbidity", border: "border-blue-500/20" },
  ];

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-morphism p-6 rounded-2xl border border-white/10 shadow-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <Droplets className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Water Intelligence Lab
            </h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-yellow-500" /> Powered by Gemini Vision
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-white/5 bg-black/20 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="border-b border-white/5 bg-white/5 p-4">
              <CardTitle className="text-lg flex items-center gap-2 font-medium">
                <Upload className="h-4 w-4 text-blue-400" />
                Input Source Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="group relative">
                <Label 
                  htmlFor="water-upload" 
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group-hover:border-blue-500/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Droplets className="w-10 h-10 mb-3 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
                    <p className="mb-2 text-sm text-blue-300">
                      <span className="font-bold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG or WEBP (MAX. 5MB)</p>
                  </div>
                  <Input 
                    id="water-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </Label>
              </div>

              {image && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                >
                  <img 
                    src={image} 
                    alt="Source" 
                    className="w-full h-auto object-cover max-h-[300px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-xs text-white/80">Captured source data</p>
                  </div>
                </motion.div>
              )}

              <Button 
                className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" 
                onClick={analyzeImage} 
                disabled={!image || analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Neural Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Execute Deep Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/5 border-yellow-500/20 rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-yellow-500 mb-1">Environmental Advisory</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI analysis is for preliminary screening only. High-precision results require clinical laboratory testing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {results ? (
                <div className="sm:col-span-2">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white text-slate-900 rounded-none shadow-2xl overflow-hidden border-[12px] border-slate-100 flex flex-col md:flex-row min-h-[700px]"
                  >
                    {/* LEFT MARGIN - CERTIFICATION DATA */}
                    <div className="md:w-64 bg-slate-50 border-r border-slate-200 p-8 flex flex-col justify-between">
                      <div className="space-y-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Batch ID</p>
                          <p className="text-sm font-mono font-bold">#{Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Date Scanned</p>
                          <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">pH Analysis</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-blue-600">{results.ph_level}</span>
                            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-red-500 via-green-500 to-blue-500" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-200">
                        <div className="bg-slate-900 p-4 rounded-lg text-white">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Final Verdict</p>
                          <p className="text-xs font-bold leading-tight">
                            {results.safety > 80 ? "Potable - Safe for consumption after standard filtration." : 
                             results.safety > 50 ? "Restricted - Industrial use only. Avoid ingestion." : 
                             "Hazardous - Toxic indicators detected. Stay clear."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MAIN REPORT BODY */}
                    <div className="flex-1 p-12 relative">
                      {/* WATERMARK */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                        <Droplets className="h-96 w-96" />
                      </div>

                      <div className="relative z-10 space-y-10">
                        <header className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                          <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900">Certificate of Analysis</h2>
                            <p className="text-sm font-bold text-slate-500 mt-1">NEMAP ENVIRONMENTAL INTELLIGENCE LABORATORY</p>
                          </div>
                          <div className={`px-6 py-2 border-2 ${results.safety > 70 ? "border-green-600 text-green-600" : "border-red-600 text-red-600"} font-black uppercase tracking-tighter rotate-[-5deg] text-xl`}>
                            {results.safety > 70 ? "CERTIFIED SAFE" : "FAIL - TOXIC"}
                          </div>
                        </header>

                        <div className="grid md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2">Core Metrics</h3>
                            {resultCards.map((card) => {
                              const value = (results as any)[card.key];
                              return (
                                <div key={card.key} className="space-y-1.5">
                                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                    <span>{card.title}</span>
                                    <span>{value}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden">
                                    <div 
                                      className={`h-full ${value > 70 ? "bg-red-600" : value > 30 ? "bg-amber-500" : "bg-blue-600"}`}
                                      style={{ width: `${value}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                            
                            <div className="p-6 bg-slate-900 text-white rounded-none flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Safety Score</span>
                              <span className="text-4xl font-black">{results.safety}%</span>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2">Detected Pollutants</h3>
                            <div className="space-y-3">
                              {results.pollutants.map((pollutant, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100">
                                  <div>
                                    <p className="text-sm font-black text-slate-900">{pollutant.name}</p>
                                    <p className={`text-[9px] font-bold uppercase ${pollutant.risk === 'high' ? 'text-red-600' : 'text-slate-400'}`}>Risk Factor: {pollutant.risk}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-black">{pollutant.level}%</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-10 border-t border-slate-100">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Chief Analyst Remarks</h3>
                          <p className="text-sm font-medium leading-relaxed italic text-slate-600">
                            "{results.reasons}"
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed font-light">
                            {results.details}
                          </p>
                        </div>

                        <div className="flex gap-4 no-print pt-6">
                          <Button className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 rounded-none font-bold uppercase tracking-widest text-xs transition-all shadow-xl" onClick={() => window.print()}>
                            Execute Official Print
                          </Button>
                          <Button variant="ghost" className="px-8 h-14 border-2 border-slate-900 text-slate-900 rounded-none font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                            Archive to Database
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-white/5 bg-white/5 rounded-3xl">
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-blue-500/10 rounded-full p-8 mb-6 ring-1 ring-blue-500/20"
                >
                  <Brain className="h-16 w-16 text-blue-400/30" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3 text-white">Detection Matrix Ready</h3>
                <p className="max-w-md text-sm leading-relaxed text-blue-200/50">
                  Awaiting optical data input. Once uploaded, our neural net will analyze molecular patterns, turbidity, and ecological indicators.
                </p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WaterAnalysis;
