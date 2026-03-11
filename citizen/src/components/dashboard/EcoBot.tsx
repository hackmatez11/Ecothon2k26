import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";

type Message = { role: "user" | "bot"; text: string };

const botResponses: Record<string, string> = {
  plastic: "Great question! Here are eco-friendly alternatives to plastic:\n• Reusable stainless steel bottles\n• Biodegradable bags (jute/cotton)\n• Bamboo toothbrushes\n• Beeswax food wraps",
  energy: "To save energy at home:\n• Switch to LED bulbs\n• Use solar panels\n• Install smart thermostats\n• Choose Energy Star appliances",
  default: "I can help you find eco-friendly alternatives! Try asking about:\n• Plastic alternatives\n• Energy saving tips\n• Green cleaning products\n• Sustainable fashion",
};

export function EcoBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! I'm your Eco Product Advisor 🌿. Ask me about eco-friendly alternatives for everyday products!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    const lower = input.toLowerCase();
    const response = lower.includes("plastic")
      ? botResponses.plastic
      : lower.includes("energy")
      ? botResponses.energy
      : botResponses.default;
    const botMsg: Message = { role: "bot", text: response };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Eco-Friendly Product Bot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "bot" && <Bot className="mt-1 h-5 w-5 shrink-0 text-primary" />}
              <div
                className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
              {m.role === "user" && <User className="mt-1 h-5 w-5 shrink-0 text-secondary" />}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about eco-friendly products..."
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
