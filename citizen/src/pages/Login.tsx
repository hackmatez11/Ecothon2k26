import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock, MapPin, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import MapPicker from '@/components/MapPicker';

export default function Login() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New location fields
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isFetchingCoords, setIsFetchingCoords] = useState(false);

  // Auto-fetch coordinates when city changes
  useEffect(() => {
    if (tab !== 'signup' || !city || city.length < 3) return;

    const fetchCoords = async () => {
      setIsFetchingCoords(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setLat(parseFloat(data[0].lat));
          setLng(parseFloat(data[0].lon));
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error);
      } finally {
        setIsFetchingCoords(false);
      }
    };

    const timeoutId = setTimeout(fetchCoords, 1000);
    return () => clearTimeout(timeoutId);
  }, [city, tab]);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    if (tab === 'signup' && password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setLoading(true);
    const { error } = tab === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, { city, latitude: lat, longitude: lng });
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(tab === 'signin' ? 'Welcome back!' : 'Account created! Welcome to EcoPortal.');
      navigate('/citizen-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a1628]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/10 blur-[150px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mb-4 backdrop-blur-sm">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EcoPortal</h1>
          <p className="text-emerald-400/80 text-sm mt-1 font-medium">Citizen Environmental Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-white/10">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {tab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                {tab === 'signin'
                  ? 'Sign in to access your citizen dashboard'
                  : 'Join thousands of citizens protecting the environment'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (signup only) */}
              {tab === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-medium text-white/70">City / Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="e.g. Guwahati, Assam"
                        className={`w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm ${isFetchingCoords ? 'animate-pulse border-emerald-500/30' : ''}`}
                      />
                      {isFetchingCoords && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button 
                      type="button" 
                      onClick={() => setShowMap(!showMap)}
                      className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                    >
                      <MapIcon className="w-3 h-3" />
                      {showMap ? 'Hide Map' : 'Select Location on Map'}
                      {lat && lng && <span className="text-white/40 ml-2 font-normal">({lat.toFixed(2)}, {lng.toFixed(2)})</span>}
                    </button>
                    
                    {showMap && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <MapPicker onLocationSelect={(la, ln) => {
                          setLat(la);
                          setLng(ln);
                        }} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Please wait...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {/* Switch Tab */}
            <p className="text-center text-sm text-white/40 mt-6">
              {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setEmail(''); setPassword(''); setConfirmPassword(''); }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                {tab === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Ecothon 2026 · Environmental Citizen Platform
        </p>
      </div>
    </div>
  );
}
