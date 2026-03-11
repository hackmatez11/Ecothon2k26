import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Hash, Users, Paperclip } from "lucide-react";
import { useState } from "react";

const channels = [
  { name: "general", unread: 3 },
  { name: "pollution-alerts", unread: 12 },
  { name: "task-updates", unread: 0 },
  { name: "water-quality", unread: 1 },
  { name: "industrial-zone", unread: 5 },
];

const messages = [
  { user: "R. Sharma", dept: "PCB", time: "10:32 AM", text: "Air quality index in Delhi NCR has crossed 200. Activating emergency protocol." },
  { user: "M. Kumar", dept: "Transport", time: "10:35 AM", text: "Implementing odd-even restrictions from tomorrow. Traffic department is notified." },
  { user: "S. Patel", dept: "Waste Mgmt", time: "10:40 AM", text: "Deonar waste burning has been controlled. Cleanup team deployed." },
  { user: "K. Reddy", dept: "Urban Dev", time: "10:45 AM", text: "Construction sites in Whitefield have been issued dust control notices." },
  { user: "A. Singh", dept: "PCB", time: "11:00 AM", text: "Factory inspection report for Kanpur zone uploaded. 3 violations found." },
];

const Communication = () => {
  const [activeChannel, setActiveChannel] = useState("pollution-alerts");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Interdepartment Communication</h1>

      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4" /> Channels</CardTitle></CardHeader>
          <CardContent className="p-2">
            {channels.map((ch) => (
              <button
                key={ch.name}
                onClick={() => setActiveChannel(ch.name)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${activeChannel === ch.name ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <span># {ch.name}</span>
                {ch.unread > 0 && <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">{ch.unread}</span>}
              </button>
            ))}
            <div className="border-t border-border mt-4 pt-4 px-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> 24 officers online</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4" /> {activeChannel}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full gov-gradient flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {m.user.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{m.user}</span>
                    <span className="text-xs text-muted-foreground">{m.dept}</span>
                    <span className="text-xs text-muted-foreground">{m.time}</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{m.text}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="icon"><Paperclip className="h-4 w-4" /></Button>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message #${activeChannel}`} className="flex-1" />
              <Button><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Communication;
