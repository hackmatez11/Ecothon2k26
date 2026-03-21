import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarCheck, Loader2, ShieldX } from "lucide-react";

const EXTERNAL_URL = import.meta.env.VITE_HOSPITAL_URL as string;
const SIGNIN_URL = `${EXTERNAL_URL}/signin`;
const EXT_SUPABASE_URL = import.meta.env.VITE_HOSPITAL_SUPABASE_URL as string;
const EXT_SUPABASE_ANON_KEY = import.meta.env.VITE_HOSPITAL_SUPABASE_ANON_KEY as string;
const EXTERNAL_AUTH_KEY = import.meta.env.VITE_HOSPITAL_AUTH_KEY as string;
const AUTO_PASSWORD = import.meta.env.VITE_HOSPITAL_AUTO_PASSWORD as string;

function getExternalSession(): { role: string; session: object } | null {
  try {
    const raw = localStorage.getItem(EXTERNAL_AUTH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const role = session?.user?.user_metadata?.role ?? null;
    if (!role) return null;
    return { role, session };
  } catch {
    return null;
  }
}

async function autoLoginExternal(email: string): Promise<string | null> {
  try {
    const res = await fetch(`${EXT_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EXT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${EXT_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, password: AUTO_PASSWORD }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.access_token) return null;

    // Store session in localStorage exactly as the external Supabase client expects
    localStorage.setItem(EXTERNAL_AUTH_KEY, JSON.stringify(data));

    return data?.user?.user_metadata?.role ?? null;
  } catch {
    return null;
  }
}

type Status = "loading" | "checking" | "patient" | "not-patient";

export default function AppointmentBooking() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!user?.email) return;

    const existing = getExternalSession();
    if (existing) {
      // Session already in localStorage — use it directly
      setStatus(existing.role.toLowerCase() === "patient" ? "patient" : "not-patient");
      return;
    }

    // No session — attempt silent auto-login with current email + fixed password
    setStatus("loading");
    autoLoginExternal(user.email).then((role) => {
      if (role) {
        if (role.toLowerCase() === "patient") {
          setStatus("patient");
        } else {
          setStatus("not-patient");
        }
      } else {
        setStatus("checking");
      }
    });
  }, [user]);

  // Poll localStorage when showing manual signin iframe
  useEffect(() => {
    if (status !== "checking") return;
    const interval = setInterval(() => {
      const existing = getExternalSession();
      if (existing) {
        clearInterval(interval);
        setStatus(existing.role.toLowerCase() === "patient" ? "patient" : "not-patient");
      }
    }, 800);
    return () => clearInterval(interval);
  }, [status]);

  if (!user) return null;

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Signing you in to the Hospital Portal...</p>
      </div>
    );
  }

  if (status === "not-patient") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4 text-center px-6">
        <div className="p-4 rounded-full bg-rose-500/10">
          <ShieldX className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold">Not Registered as a Patient</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your account is not registered as a patient in the Hospital Management system.
          Please sign up as a patient to access appointment booking.
        </p>
        <a
          href={SIGNIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          Go to Hospital Portal
        </a>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
        <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Sign in to the Hospital Portal to verify your patient registration...</span>
        </div>
        <div className="flex-1 rounded-lg overflow-hidden border border-border">
          <iframe
            src={SIGNIN_URL}
            title="Hospital Portal Sign In"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    );
  }

  // status === "patient"
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
      <div className="flex items-center gap-2 px-1">
        <CalendarCheck className="h-4 w-4 text-rose-500" />
        <span className="text-sm font-medium">Appointment Booking — Hospital Management Portal</span>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-border">
        <iframe
          src={`${EXTERNAL_URL}/patient-dashboard`}
          title="Appointment Booking"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
