import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Send, Bot, User } from "lucide-react";
import { useState } from "react";

type Message = { role: "user" | "bot"; text: string };

const botResponses: Record<string, string> = {
  default: "I can help you find eco-friendly alternatives! Try asking about products like 'plastic bags', 'water bottles', 'cleaning products', or 'packaging materials'.",
  plastic: "🌿 **Eco-friendly alternatives to plastic bags:**\n\n• **Jute bags** - Durable and biodegradable\n• **Cotton tote bags** - Reusable and washable\n• **Paper bags** - Recyclable option\n• **Bamboo fiber bags** - Sustainable material\n\n🏷️ **Green Brands:** Ecobags, Bagito, ChicoBag",
  bottle: "🌿 **Eco-friendly alternatives to plastic bottles:**\n\n• **Stainless steel bottles** - Long-lasting, BPA-free\n• **Glass bottles** - Recyclable and chemical-free\n• **Bamboo bottles** - Sustainable and unique\n• **Copper bottles** - Health benefits + sustainable\n\n🏷️ **Green Brands:** Klean Kanteen, S'well, Hydro Flask",
  cleaning: "🌿 **Eco-friendly cleaning alternatives:**\n\n• **Vinegar + Baking soda** - Natural all-purpose cleaner\n• **Castile soap** - Plant-based, biodegradable\n• **Enzyme cleaners** - Biological, non-toxic\n• **Reusable cloths** - Replace paper towels\n\n🏷️ **Green Brands:** Seventh Generation, Dr. Bronner's, Method",
  packaging: "🌿 **Eco-friendly packaging alternatives:**\n\n• **Mushroom packaging** - Biodegradable foam alternative\n• **Cornstarch packaging** - Compostable peanuts\n• **Recycled cardboard** - Sustainable boxes\n• **Seaweed wrap** - Edible packaging\n\n🏷️ **Green Brands:** Ecovative, Novamont, Vegware",
};

const EcoProducts = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: botResponses.default },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    const lower = input.toLowerCase();
    let response = botResponses.default;
    if (lower.includes("plastic") || lower.includes("bag")) response = botResponses.plastic;
    else if (lower.includes("bottle") || lower.includes("water")) response = botResponses.bottle;
    else if (lower.includes("clean")) response = botResponses.cleaning;
    else if (lower.includes("packag")) response = botResponses.packaging;

    setMessages([...messages, userMsg, { role: "bot", text: response }]);
    setInput("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Eco-Friendly Product Bot</h1>

      <div className="max-w-2xl mx-auto">
        <Card className="flex flex-col h-[calc(100vh-220px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-primary" /> EcoBot</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "bot" && (
                  <div className="h-8 w-8 rounded-full gov-gradient flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about eco-friendly alternatives..." className="flex-1" />
              <Button onClick={handleSend}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EcoProducts;
