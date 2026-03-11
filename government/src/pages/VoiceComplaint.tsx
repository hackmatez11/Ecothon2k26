import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useState } from "react";

const VoiceComplaint = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript("");
      // Simulate speech recognition
      setTimeout(() => {
        setTranscript("There is heavy smoke coming from the factory near Sector 15, Noida. The air quality has become very poor and residents are facing breathing problems. This has been going on for the past 3 days.");
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Voice Complaint Bot</h1>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Speak Your Complaint</CardTitle>
            <p className="text-sm text-muted-foreground text-center">Press the microphone button and describe your environmental complaint. AI will convert it to a complaint ticket.</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <button
                onClick={toggleRecording}
                className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-destructive animate-pulse scale-110" : "gov-gradient hover:opacity-90"}`}
              >
                {isRecording ? <MicOff className="h-10 w-10 text-destructive-foreground" /> : <Mic className="h-10 w-10 text-primary-foreground" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{isRecording ? "Listening... Speak now" : "Tap to start recording"}</p>

            {transcript && (
              <div className="text-left space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">Transcription</span>
                    </div>
                    <p className="text-sm text-foreground">{transcript}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm text-foreground mb-2">AI Generated Ticket</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground"><strong className="text-foreground">Type:</strong> Industrial Pollution - Factory Emissions</p>
                      <p className="text-muted-foreground"><strong className="text-foreground">Location:</strong> Sector 15, Noida</p>
                      <p className="text-muted-foreground"><strong className="text-foreground">Duration:</strong> 3 days</p>
                      <p className="text-muted-foreground"><strong className="text-foreground">Impact:</strong> Air quality, respiratory health</p>
                      <p className="text-muted-foreground"><strong className="text-foreground">Priority:</strong> High</p>
                    </div>
                    <Button className="w-full mt-4">Submit Complaint Ticket</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceComplaint;
