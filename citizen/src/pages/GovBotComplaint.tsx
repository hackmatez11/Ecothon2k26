import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Send, Loader2, AlertCircle, CheckCircle2, 
  MapPin, ClipboardList, Info, ShieldCheck
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000';

const CATEGORIES = [
  { id: 'factory_smoke', label: 'Industrial Smoke/Air Pollution' },
  { id: 'industrial_water_pollution', label: 'Industrial Water Discharge' },
  { id: 'sewage_overflow', label: 'Sewage/Drainage Overflow' },
  { id: 'road_widening', label: 'Road Widening/Infrastructure' },
  { id: 'pothole', label: 'Potholes/Road Damage' },
  { id: 'streetlight_failure', label: 'Streetlight Failure' },
  { id: 'garbage_dumping', label: 'Illegal Garbage Dumping' },
  { id: 'water_supply_shortage', label: 'Water Supply Shortage' },
  { id: 'water_quality', label: 'Water Quality Issues' },
  { id: 'mosquito_breeding', label: 'Stagnant Water/Mosquitoes' },
  { id: 'noise_pollution', label: 'Noise Pollution' },
  { id: 'open_drain', label: 'Open Drains' },
  { id: 'encroachment', label: 'Land Encroachment' },
];

export default function GovBotComplaint() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    citizenName: user?.email?.split('@')[0] || '',
    category: '',
    description: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ id: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.description || !formData.citizenName || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          citizenEmail: user?.email || 'anonymous',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmissionResult({ id: data.complaintId });
        toast.success('Complaint submitted to GOBOT system!');
      } else {
        throw new Error(data.error || 'Failed to submit complaint');
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection error with GOBOT server');
    } finally {
      setSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 mb-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 mb-4">
          Complaint Received!
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          The relevant government departments have been notified via GOBOT.
        </p>
        <div className="bg-card/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-8 mb-8 shadow-2xl shadow-emerald-500/5">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Tracking Identification</p>
          <p className="text-4xl font-mono font-bold text-emerald-400 select-all">{submissionResult.id}</p>
        </div>
        <button
          onClick={() => { setSubmissionResult(null); setFormData({ ...formData, description: '', category: '' }); }}
          className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> GOBOT System Integration
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Official Government Portal</h1>
          <p className="text-muted-foreground mt-2 text-lg">Centralized Inter-Departmental Resolution System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="space-y-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                    <Info className="w-3.5 h-3.5" /> Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.citizenName}
                    onChange={e => setFormData({ ...formData, citizenName: e.target.value })}
                    className="w-full h-12 bg-muted/40 border-border/40 border rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full h-12 bg-muted/40 border-border/40 border rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                    placeholder="e.g. Sector 12, New Delhi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                  <ClipboardList className="w-3.5 h-3.5" /> Issue Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-12 bg-muted/40 border-border/40 border rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select the category of your complaint</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">Detailed Description</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-muted/40 border-border/40 border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all resize-none"
                  placeholder="Please provide full details. Our AI agents will use this to coordinate across departments."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:from-emerald-700 hover:to-teal-700 transition-all hover:shadow-xl hover:shadow-emerald-600/20 disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting to GOBOT...</>
                ) : (
                  <><Send className="w-5 h-5" /> Launch Official Investigation</>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-500" /> System Protocols
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                Your complaint is automatically categorized by our Supervisor AI Agent.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                Cross-department dependencies are automatically identified and requested via Slack.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                Officers are notified within seconds across Environment, Water, Roads, and Health departments.
              </li>
            </ul>
          </div>
          
          <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-center">
            <p className="text-xs text-muted-foreground mb-1 italic">Powered by Hugging Face Flan-T5 & RAG Memory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
