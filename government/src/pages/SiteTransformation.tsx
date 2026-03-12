import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  MapPin, 
  Upload, 
  Trash2, 
  Clock, 
  IndianRupee, 
  FileCheck, 
  Hammer, 
  Sparkles, 
  Loader2, 
  Brain,
  Download,
  Printer
} from "lucide-react";
import { analyzeImageWithPrompt } from "../services/groqVision";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TransformationPhase {
  name: string;
  duration: string;
  activities: string[];
}

interface Resource {
  item: string;
  quantity: string;
}

interface SiteTransformationPlan {
  siteType: string;
  location: string;
  phases: TransformationPhase[];
  resources: Resource[];
  totalCostEstimate: string;
  totalTimeline: string;
  requiredPermissions: { department: string; document: string; reason: string }[];
  environmentalImpact: string;
}

const SiteTransformation = () => {
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<SiteTransformationPlan | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResults(null);
        setAfterImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePlan = async () => {
    if (!image || !location) {
      toast.error("Please provide both an image and a location.");
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `Analyze this image of an unhygienic site at location: "${location}". 
      Generate a detailed transformation plan to turn it into a clean, beautiful, and sustainable site.
      
      Return the results strictly as a JSON object with the following keys:
      - "siteType": string (e.g., "Illegal Dumping Ground", "Contaminated Waterfront", "Derelict Urban Alley")
      - "location": string (as provided)
      - "phases": array of { "name": string, "duration": string, "activities": string[] } (at least 3 phases)
      - "resources": array of { "item": string, "quantity": string } (labor, tools, materials)
      - "totalCostEstimate": string (in INR, e.g., "₹4,50,000"), keep the costing with maximum upper limit of 8 lakhs.
      - "totalTimeline": string (e.g., "4 months")
      - "requiredPermissions": array of { "department": string, "document": string, "reason": string } (Include specific Indian departments like MoEFCC, SPCB, Municipal Corp if applicable)
      - "environmentalImpact": string (one-sentence summary of long-term ecological benefits) , give the numerical data .

      Focus on professional, realistic site remediation steps. Do not include any markdown or code blocks.`;

      const response = await analyzeImageWithPrompt(image, prompt);
      
      try {
        const cleanJson = response.replace(/```json|```/g, "").trim();
        const jsonResult = JSON.parse(cleanJson);
        setResults(jsonResult);
        toast.success("Transformation plan generated successfully!");
        
        // Trigger after-image generation
        generateAfterImage(image, jsonResult.siteType);
      } catch (parseError) {
        console.error("Error parsing AI response:", response);
        toast.error("Error parsing AI response. Please try again.");
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Process failed. Please verify your connection and Groq API key.");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAfterImage = async (sourceImage: string, siteType: string) => {
    setGeneratingImage(true);
    try {
      const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
      if (!apiKey) {
        throw new Error("Stability API key not found");
      }

      // Convert base64 to blob and resize to supported dimensions
      const base64Data = sourceImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const originalBlob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create image to get dimensions and resize
      const img = new Image();
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Use 1024x1024 for best results (square format)
          const targetWidth = 1024;
          const targetHeight = 1024;
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Draw and resize image
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create blob from canvas'));
            }
          }, 'image/jpeg', 0.9);
        };
        
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = URL.createObjectURL(originalBlob);
      });

      const prompt = `clean urban environment, remove garbage and waste, add green plants and trees, clean road, beautiful public space, transformed ${siteType}, highly detailed, photorealistic`;

      // Create form data for multipart/form-data request
      const formData = new FormData();
      
      // Add resized init image
      formData.append('init_image', imageBlob, 'source.jpg');
      
      // Add text prompt
      formData.append('text_prompts[0][text]', prompt);
      formData.append('text_prompts[0][weight]', '1.0');
      
      // Add negative prompt to preserve good elements
      formData.append('text_prompts[1][text]', 'garbage, waste, trash, pollution, dirty, unhygienic');
      formData.append('text_prompts[1][weight]', '-0.8');
      
      // Image-to-image parameters (35% strength = 65% transformation)
      formData.append('init_image_mode', 'IMAGE_STRENGTH');
      formData.append('image_strength', '0.35');
      
      // Generation parameters
      formData.append('cfg_scale', '7');
      formData.append('samples', '1');
      formData.append('steps', '30');
      formData.append('sampler', 'K_DPMPP_2M');
      formData.append('style_preset', 'photographic');

      const response = await fetch(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stability API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.artifacts && result.artifacts.length > 0) {
        const imageBase64 = result.artifacts[0].base64;
        const fullImageUrl = `data:image/png;base64,${imageBase64}`;
        setAfterImage(fullImageUrl);
        toast.success("AI After-Image visualization generated!");
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Error generating after image:", error);
      toast.error("Failed to generate AI concept image. Using text plan only.");
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-emerald-500/20 p-4 rounded-2xl shadow-inner border border-emerald-500/30">
            <Building2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
              Site Transformation Engine
            </h1>
            <p className="text-emerald-400/60 text-sm font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
              <Sparkles className="h-4 w-4" /> AI-Powered Urban Remediation Planning
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {/* INPUT SECTION */}
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-[#111] border-emerald-500/10 rounded-3xl overflow-hidden shadow-2xl relative hover:border-emerald-500/30 transition-colors">
            <CardHeader className="border-b border-emerald-500/10 bg-emerald-500/5 p-6">
              <CardTitle className="text-xl flex items-center gap-3 font-bold text-emerald-400 uppercase tracking-tight">
                <Upload className="h-5 w-5" />
                Input Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label htmlFor="location" className="text-sm font-black uppercase tracking-widest text-emerald-400/70">
                  Target Site Location
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 group-focus-within:text-emerald-300 transition-colors" />
                  <Input 
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter locality, city (e.g. Bandra, Mumbai)"
                    className="bg-[#1A1A1A] border-emerald-500/10 h-14 pl-12 rounded-2xl focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-black uppercase tracking-widest text-emerald-400/70">
                  Source Visual Data
                </Label>
                <div className="group relative">
                  <Label 
                    htmlFor="site-upload" 
                    className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-emerald-500/10 rounded-3xl bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group-hover:border-emerald-500/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Trash2 className="w-12 h-12 mb-4 text-emerald-400/30 group-hover:text-emerald-400 transition-all group-hover:scale-110" />
                      <p className="mb-2 text-sm text-emerald-300 font-bold">
                        UPLOAD UNHYGIENIC SITE IMAGE
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Supports JPG, PNG, WEBP (MAX. 10MB)</p>
                    </div>
                    <Input 
                      id="site-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </Label>
                </div>
              </div>

              {image && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl overflow-hidden shadow-2xl ring-2 ring-emerald-500/20 border border-emerald-500/30"
                >
                  <img src={image} alt="Site" className="w-full h-auto object-cover max-h-[300px]" />
                </motion.div>
              )}

              <Button 
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50" 
                onClick={generatePlan} 
                disabled={!image || !location || analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Calculating Transformation...
                  </>
                ) : (
                  <>
                    <Brain className="mr-3 h-6 w-6" />
                    Initialize Master Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RESULTS SECTION */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* HEADLINE STATS */}
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: "Detected Site Type", value: results.siteType, icon: Building2, color: "text-emerald-400" },
                    { label: "Estimated Duration", value: results.totalTimeline, icon: Clock, color: "text-blue-400" },
                    { label: "Projected Costing", value: results.totalCostEstimate, icon: IndianRupee, color: "text-amber-400" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-30" style={{ color: stat.color.split('-')[1] }} />
                      <div className="flex items-center gap-4">
                        <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                          <p className="text-xl font-black text-white">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VISUAL TRANSFORMATION */}
                <Card className="bg-[#111] border-emerald-500/10 rounded-3xl overflow-hidden shadow-2xl relative">
                  <CardHeader className="border-b border-emerald-500/10 bg-emerald-500/5 p-6">
                    <CardTitle className="text-xl flex items-center justify-between font-bold text-emerald-400 uppercase tracking-tight">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5" />
                        AI Vision Transformation
                      </div>
                      {generatingImage && (
                        <div className="flex items-center gap-2 text-sm text-emerald-400/70 font-bold bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                          <Loader2 className="h-4 w-4 animate-spin" /> Rendering concept...
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-emerald-500/10">
                      {/* Before */}
                      <div className="relative group p-6">
                        <div className="absolute top-8 left-8 z-10 bg-neutral-900/80 backdrop-blur-md text-white px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg border border-white/10 shadow-xl">
                          Current State
                        </div>
                        <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 aspect-video bg-neutral-900">
                          {image && <img src={image} alt="Before" className="w-full h-full object-cover grayscale-[20%] contrast-125" />}
                        </div>
                      </div>
                      
                      {/* After */}
                      <div className="relative group p-6 bg-emerald-950/20">
                        <div className="absolute top-8 left-8 z-10 bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg shadow-xl shadow-emerald-500/20">
                          Projected Future
                        </div>
                        <div className="rounded-2xl overflow-hidden ring-2 ring-emerald-500/30 aspect-video bg-[#0A0A0A] relative">
                          <AnimatePresence>
                            {afterImage ? (
                              <motion.img 
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={afterImage} 
                                alt="After" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500/40 p-6 text-center">
                                {generatingImage ? (
                                  <>
                                    <Sparkles className="h-12 w-12 mb-4 animate-pulse opacity-50" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Synthesizing Vision<br/>Based on Plan Parameters...</p>
                                  </>
                                ) : (
                                  <>
                                    <Brain className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Awaiting AI Image Generation</p>
                                  </>
                                )}
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* MAIN PLAN BODY */}
                <div className="bg-white text-[#0A0A0A] rounded-[2rem] shadow-2xl overflow-hidden border-[16px] border-neutral-900 min-h-[800px] flex flex-col md:flex-row print:border-none print:shadow-none">
                  {/* SIDEBAR - RESOURCES & PERMISSIONS */}
                  <div className="md:w-80 bg-neutral-50 border-r border-neutral-200 p-8 space-y-12">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 border-b border-neutral-200 pb-3 mb-6 flex items-center gap-2">
                        <Hammer className="h-4 w-4" /> Operational Resources
                      </h3>
                      <div className="space-y-4">
                        {results.resources.map((res, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <span className="text-sm font-bold text-neutral-600">{res.item}</span>
                            <span className="text-xs font-black bg-neutral-200 px-2 py-0.5 rounded">{res.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 border-b border-neutral-200 pb-3 mb-6 flex items-center gap-2">
                        <FileCheck className="h-4 w-4" /> Permits & Clearances
                      </h3>
                      <div className="space-y-6">
                        {results.requiredPermissions.map((perm, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">{perm.department}</p>
                            <p className="text-sm font-black">{perm.document}</p>
                            <p className="text-[10px] text-neutral-500 leading-tight">{perm.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-neutral-200 mt-auto">
                      <div className="bg-emerald-950 p-6 rounded-2xl text-emerald-400 shadow-xl">
                        <p className="text-[9px] font-black uppercase tracking-widest mb-2 opacity-60">Ecological Dividend</p>
                        <p className="text-xs font-bold leading-relaxed italic">
                          "{results.environmentalImpact}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CONTENT - TRANSFORMATION PHASES */}
                  <div className="flex-1 p-12 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-[2.5] rotate-[15deg]">
                        <Building2 className="h-96 w-96 text-neutral-900" />
                    </div>

                    <div className="relative z-10 space-y-12">
                      <header className="flex justify-between items-start border-b-4 border-neutral-900 pb-8">
                        <div>
                          <div className="bg-neutral-900 text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.4em] inline-block mb-4">
                            Official AI Masterplan
                          </div>
                          <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">
                            Urban <br /> Restoration
                          </h2>
                          <div className="flex items-center gap-2 mt-4 text-neutral-500 font-bold italic">
                            <MapPin className="h-4 w-4" /> {results.location}
                          </div>
                        </div>
                        <div className="w-24 h-24 border-8 border-neutral-100 rounded-full flex items-center justify-center text-neutral-100 flex-shrink-0">
                          <Sparkles className="h-10 w-10 opacity-10" />
                        </div>
                      </header>

                      <div className="space-y-12">
                        {results.phases.map((phase, i) => (
                          <div key={i} className="group transition-all">
                            <div className="flex items-end justify-between mb-4">
                              <div className="flex items-baseline gap-4">
                                <span className="text-5xl font-black text-neutral-200 group-hover:text-emerald-500 transition-colors">0{i+1}</span>
                                <h4 className="text-2xl font-black uppercase tracking-tighter">{phase.name}</h4>
                              </div>
                              <span className="text-sm font-bold bg-neutral-100 px-4 py-1 rounded-full">{phase.duration}</span>
                            </div>
                            <ul className="space-y-3 pl-20">
                              {phase.activities.map((act, j) => (
                                <li key={j} className="text-sm font-medium text-neutral-600 flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full flex-shrink-0" />
                                  {act}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <footer className="pt-12 border-t border-neutral-100 flex flex-wrap gap-4 no-print">
                        <Button 
                          className="bg-neutral-900 hover:bg-neutral-800 text-white px-10 h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all hover:-translate-y-1"
                          onClick={() => window.print()}
                        >
                          <Printer className="mr-3 h-5 w-5" /> Execute Print Dispatch
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-4 border-neutral-900 text-neutral-900 px-10 h-16 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50 transition-all hover:-translate-y-1"
                        >
                          <Download className="mr-3 h-5 w-5" /> Archive Strategic Plan
                        </Button>
                      </footer>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full min-h-[700px] flex flex-col items-center justify-center p-12 text-center bg-[#111]/50 border-2 border-dashed border-emerald-500/5 rounded-[3rem]"
              >
                <div className="relative mb-12">
                  <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full"
                  />
                  <div className="relative bg-emerald-500/10 rounded-full p-12 ring-1 ring-emerald-500/20 backdrop-blur-3xl shadow-2xl">
                    <Brain className="h-24 w-24 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-4xl font-black mb-4 text-white uppercase tracking-tighter italic">
                  Systems Ready for Input
                </h3>
                <p className="max-w-lg text-lg leading-relaxed text-emerald-400/40 font-medium">
                  Upload tactical imagery and specify the geographical sector to initialize the neural transformation architect.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-12 max-w-md w-full opacity-30">
                  <div className="h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="h-full w-1/2 bg-emerald-500"
                    />
                  </div>
                  <div className="h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ x: ["100%", "-100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-full w-1/3 bg-emerald-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SiteTransformation;
