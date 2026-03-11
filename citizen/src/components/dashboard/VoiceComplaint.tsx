import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function VoiceComplaint() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript("");
      // Simulate voice-to-text
      setTimeout(() => {
        setTranscript("Garbage burning near my area, causing heavy smoke and air pollution.");
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const submitVoiceComplaint = () => {
    if (transcript) {
      toast.success("Voice complaint submitted! Complaint ID: #ENV-2024-1848");
      setTranscript("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Complaint System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <p className="text-sm text-muted-foreground">
          Press the microphone to record your complaint. It will be automatically converted to text.
        </p>
        <button
          onClick={toggleRecording}
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-all ${
            isRecording
              ? "animate-pulse bg-status-danger text-primary-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </button>
        <p className="text-sm font-medium text-foreground">
          {isRecording ? "Listening... Speak now" : "Tap to start recording"}
        </p>
        {transcript && (
          <div className="rounded-lg border bg-muted p-4 text-left">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Transcribed Text:</p>
            <p className="text-sm text-foreground">"{transcript}"</p>
            <Button onClick={submitVoiceComplaint} className="mt-3 gap-2" size="sm">
              <CheckCircle className="h-4 w-4" /> Submit as Complaint
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
