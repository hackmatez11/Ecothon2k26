import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { assignOfficerToComplaint } from '@/lib/assignOfficer';
import { toast } from 'sonner';
import {
  Upload, Loader2, Leaf, Droplets, Wind, Tractor,
  Trash2, TreePine, Mountain, AlertCircle, CheckCircle2, Image, Send
} from 'lucide-react';

// Department definitions used for AI categorization
const DEPARTMENTS = [
  { key: 'environment', label: 'Environment Department', icon: Leaf, color: 'bg-green-500', textColor: 'text-green-400', borderColor: 'border-green-500/40', description: 'Air quality, general environmental issues' },
  { key: 'water', label: 'Water Department', icon: Droplets, color: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500/40', description: 'Water pollution, contamination, rivers' },
  { key: 'pollution', label: 'Pollution Department', icon: Wind, color: 'bg-orange-500', textColor: 'text-orange-400', borderColor: 'border-orange-500/40', description: 'Industrial, air & noise pollution' },
  { key: 'agriculture', label: 'Agricultural Department', icon: Tractor, color: 'bg-yellow-500', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/40', description: 'Pesticides, farmland, crop issues' },
  { key: 'waste', label: 'Waste Department', icon: Trash2, color: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-500/40', description: 'Illegal dumping, garbage, landfills' },
  { key: 'forest', label: 'Forest Department', icon: TreePine, color: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/40', description: 'Deforestation, wildlife, forest fires' },
  { key: 'soil', label: 'Soil Conservation Department', icon: Mountain, color: 'bg-amber-600', textColor: 'text-amber-400', borderColor: 'border-amber-500/40', description: 'Soil erosion, land degradation' },
];

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

interface AIResult {
  department: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

async function analyzeImageWithGroq(base64Image: string, mimeType: string): Promise<AIResult> {
  const prompt = `You are an environmental complaint AI classifier for a government system.
Analyze this image and respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "department": "<one of: environment | water | pollution | agriculture | waste | forest | soil>",
  "description": "<a clear 2-3 sentence description of the environmental issue visible in the image>",
  "severity": "<one of: low | medium | high>",
  "details": "<brief analysis of what you see and why you selected this department>"
}

Department selection rules:
- environment: air quality issues, smog, general environmental degradation
- water: water bodies pollution, river contamination, water discoloration
- pollution: industrial smoke stacks, factories emitting pollutants, vehicle emissions, noise sources
- agriculture: pesticide misuse, crop damage, farmland issues
- waste: garbage dumps, illegal waste disposal, littering, landfills
- forest: deforestation, tree cutting, forest fires, wildlife harm
- soil: soil erosion, land degradation, mining damage, chemical spills on land
- If unsure or none match, use "environment" as default.

Respond ONLY with the JSON object.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  console.log('Groq raw output:', text);

  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export default function SubmitComplaint() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMime, setImageMime] = useState<string>('');

  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }

    setImageFile(file);
    setAiResult(null);
    setDescription('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) { toast.error('Please upload an image first'); return; }
    setAnalyzing(true);
    try {
      const result = await analyzeImageWithGroq(imageBase64, imageMime);
      setAiResult(result);
      setDescription(result.description);
      toast.success('Image analyzed successfully!');
    } catch (err) {
      toast.error('AI analysis failed. Please try again or fill in details manually.');
      setAiResult({ department: 'environment', description: '', severity: 'medium', details: 'Manual entry required' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) { toast.error('Please upload an image'); return; }
    if (!description.trim()) { toast.error('Please add a description'); return; }
    if (!aiResult) { toast.error('Please analyze the image first'); return; }

    setSubmitting(true);
    try {
      // Upload image to Supabase Storage
      const fileName = `complaints/${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

      let imageUrl = '';
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('complaint-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // Insert complaint record
      const { data, error } = await supabase.from('complaints').insert({
        citizen_email: user?.email ?? 'anonymous',
        citizen_id: user?.id ?? null,
        description: description.trim(),
        image_url: imageUrl || imagePreview,
        ai_analysis: aiResult.details,
        department: aiResult.department?.toLowerCase()?.trim() || 'environment',
        severity: aiResult.severity,
        status: 'pending',
        location: location.trim() || 'Not specified',
        citizen_phone: phone.trim() || null,
      }).select('id').single();

      if (error) throw error;

      // Immediately assign to an officer — no need for government dashboard to be open
      const dept = aiResult.department?.toLowerCase()?.trim() || 'environment';
      assignOfficerToComplaint(
        data.id,
        dept,
        description.trim(),
        aiResult.details
      ).then(officerName => {
        if (officerName) {
          console.log(`Complaint auto-assigned to: ${officerName}`);
        }
      });

      const id = `CMP-${(data?.id as string).slice(0, 8).toUpperCase()}`;
      setTrackingId(id);
      setSubmitted(true);
      toast.success('Complaint submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint. Check your Supabase setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const deptKey = aiResult?.department?.toLowerCase()?.trim() || 'environment';
  const dept = DEPARTMENTS.find(d => d.key === deptKey) ?? DEPARTMENTS[0];
  const DeptIcon = dept.icon;

  const severityConfig = {
    low: { label: 'Low Severity', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
    medium: { label: 'Medium Severity', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    high: { label: 'High Severity', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  };
  const sev = severityConfig[aiResult?.severity ?? 'medium'];

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Submitted!</h2>
          <p className="text-muted-foreground mb-4">Your complaint has been forwarded to the <strong className="text-foreground">{dept.label}</strong>.</p>
          <div className="inline-block px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
            <span className="text-sm text-muted-foreground">Tracking ID: </span>
            <span className="font-mono font-bold text-emerald-400">{trackingId}</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSubmitted(false); setImageFile(null); setImagePreview(null); setAiResult(null); setDescription(''); setLocation(''); }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-emerald-500" />
          Submit Environmental Complaint
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Upload an image and our AI will analyze the issue and route it to the appropriate government department.</p>
      </div>

      {/* Step 1: Upload Image */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</span>
          <h2 className="font-semibold text-foreground">Upload Evidence Photo</h2>
        </div>

        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
          >
            <Image className="w-12 h-12 mx-auto text-muted-foreground group-hover:text-emerald-400 transition-colors mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Click to upload photo</p>
            <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={imagePreview} alt="Uploaded complaint" className="w-full max-h-64 object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setAiResult(null); setDescription(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
              >✕</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              <span>{imageFile?.name}</span>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

        {imagePreview && !aiResult && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image with AI...</> : <><Leaf className="w-4 h-4" /> Analyze with Groq AI</>}
          </button>
        )}
      </div>

      {/* Step 2: AI Result */}
      {aiResult && (
        <div className={`rounded-2xl border ${dept.borderColor} bg-card p-6 space-y-4 animate-in fade-in duration-300`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="font-semibold text-foreground">AI Analysis Result</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Department Badge */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${dept.borderColor} bg-card`}>
              <DeptIcon className={`w-5 h-5 ${dept.textColor}`} />
              <div>
                <p className="text-xs text-muted-foreground">Assigned to</p>
                <p className={`text-sm font-bold ${dept.textColor}`}>{dept.label}</p>
              </div>
            </div>
            {/* Severity Badge */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${sev.bg}`}>
              <AlertCircle className={`w-4 h-4 ${sev.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">Severity</p>
                <p className={`text-sm font-bold ${sev.color}`}>{sev.label}</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">AI Reasoning: </span>{aiResult.details}
          </div>

          {/* Re-analyze */}
          <button onClick={handleAnalyze} disabled={analyzing}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Loader2 className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} /> Re-analyze image
          </button>
        </div>
      )}

      {/* Step 3: Fill Details & Submit */}
      {aiResult && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">3</span>
            <h2 className="font-semibold text-foreground">Complaint Details</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Description <span className="text-destructive">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the environmental issue..."
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground/60">AI pre-filled this — edit as needed.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Delhi, Yamuna River near ITO bridge"
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Phone Number (to receive resolution SMS)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
            />
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground">
              Submitting as: <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              This complaint will be sent to: <span className={`font-semibold ${dept.textColor}`}>{dept.label}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Complaint</>}
          </button>
        </form>
      )}

      {/* Department reference */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-3 text-sm">Available Departments</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEPARTMENTS.map(d => {
            const Icon = d.icon;
            return (
              <div key={d.key} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <Icon className={`w-4 h-4 shrink-0 ${d.textColor}`} />
                <span className="text-xs text-muted-foreground leading-tight">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
