import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Leaf, Car, Home, ShoppingBag, Utensils, Plane, Loader2 } from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function analyzeFootprint(data: FootprintData) {
  const prompt = `
You are an environmental analyst. Based on the following lifestyle data, calculate and analyze the user's carbon footprint in detail.

USER DATA:
- Location/Country: ${data.country}
- Household size: ${data.householdSize} people

TRANSPORT:
- Car type: ${data.carType} (${data.carKmPerWeek} km/week)
- Public transport: ${data.publicTransportHoursPerWeek} hours/week
- Flights per year: ${data.flightsPerYear} (avg duration: ${data.avgFlightHours} hours each)
- Motorcycle/scooter: ${data.motorcycleKmPerWeek} km/week

HOME ENERGY:
- Electricity usage: ${data.electricityKwhPerMonth} kWh/month
- Energy source: ${data.energySource}
- Natural gas: ${data.gasUsagePerMonth} units/month
- Home size: ${data.homeSize} sq ft
- Heating fuel: ${data.heatingFuel}

DIET:
- Diet type: ${data.dietType}
- Beef/lamb meals per week: ${data.beefMealsPerWeek}
- Dairy servings per day: ${data.dairyServingsPerDay}
- Food waste level: ${data.foodWasteLevel}
- Local/organic food percentage: ${data.localFoodPercent}%

SHOPPING & LIFESTYLE:
- New clothing items per month: ${data.clothingItemsPerMonth}
- Electronics purchases per year: ${data.electronicsPerYear}
- Online shopping orders per month: ${data.onlineOrdersPerMonth}
- Recycling habit: ${data.recyclingHabit}

Return a JSON object (raw JSON only, no markdown, no code blocks) with this exact structure:
{
  "totalAnnualKgCO2": number,
  "monthlyKgCO2": number,
  "comparisonToAverage": "string describing how this compares to national/global average",
  "rating": "Excellent|Good|Average|High|Very High",
  "ratingScore": number between 1-100 (100 = best/lowest footprint),
  "breakdown": {
    "transport": { "kgCO2": number, "percentage": number, "details": "string" },
    "homeEnergy": { "kgCO2": number, "percentage": number, "details": "string" },
    "diet": { "kgCO2": number, "percentage": number, "details": "string" },
    "shopping": { "kgCO2": number, "percentage": number, "details": "string" }
  },
  "topImpacts": ["string", "string", "string"],
  "recommendations": [
    { "action": "string", "potentialSavingKg": number, "difficulty": "Easy|Medium|Hard", "category": "transport|home|diet|shopping" },
    { "action": "string", "potentialSavingKg": number, "difficulty": "Easy|Medium|Hard", "category": "transport|home|diet|shopping" },
    { "action": "string", "potentialSavingKg": number, "difficulty": "Easy|Medium|Hard", "category": "transport|home|diet|shopping" },
    { "action": "string", "potentialSavingKg": number, "difficulty": "Easy|Medium|Hard", "category": "transport|home|diet|shopping" },
    { "action": "string", "potentialSavingKg": number, "difficulty": "Easy|Medium|Hard", "category": "transport|home|diet|shopping" }
  ],
  "equivalents": {
    "treesNeededToOffset": number,
    "kmDrivenEquivalent": number,
    "flightsEquivalent": string
  },
  "summary": "string (2-3 sentence personalized summary)"
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error?.message || "Analysis failed");
  }
  const result = await response.json();
  const raw = result.choices[0].message.content.trim();
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

type FootprintData = {
  country: string; householdSize: number;
  carType: string; carKmPerWeek: number; publicTransportHoursPerWeek: number;
  flightsPerYear: number; avgFlightHours: number; motorcycleKmPerWeek: number;
  electricityKwhPerMonth: number; energySource: string; gasUsagePerMonth: number;
  homeSize: number; heatingFuel: string;
  dietType: string; beefMealsPerWeek: number; dairyServingsPerDay: number;
  foodWasteLevel: string; localFoodPercent: number;
  clothingItemsPerMonth: number; electronicsPerYear: number;
  onlineOrdersPerMonth: number; recyclingHabit: string;
};

const defaultData: FootprintData = {
  country: "India", householdSize: 3,
  carType: "petrol", carKmPerWeek: 100, publicTransportHoursPerWeek: 5,
  flightsPerYear: 2, avgFlightHours: 3, motorcycleKmPerWeek: 0,
  electricityKwhPerMonth: 200, energySource: "grid", gasUsagePerMonth: 5,
  homeSize: 1000, heatingFuel: "none",
  dietType: "omnivore", beefMealsPerWeek: 2, dairyServingsPerDay: 2,
  foodWasteLevel: "moderate", localFoodPercent: 30,
  clothingItemsPerMonth: 2, electronicsPerYear: 1,
  onlineOrdersPerMonth: 4, recyclingHabit: "sometimes",
};

const ratingColor: Record<string, string> = {
  Excellent: "text-emerald-500", Good: "text-green-500",
  Average: "text-yellow-500", High: "text-orange-500", "Very High": "text-red-500",
};
const ratingBg: Record<string, string> = {
  Excellent: "bg-emerald-500", Good: "bg-green-500",
  Average: "bg-yellow-500", High: "bg-orange-500", "Very High": "bg-red-500",
};
const difficultyColor: Record<string, string> = {
  Easy: "bg-green-100 text-green-700", Medium: "bg-yellow-100 text-yellow-700", Hard: "bg-red-100 text-red-700",
};
const categoryIcon: Record<string, React.ReactNode> = {
  transport: <Car className="h-3.5 w-3.5" />,
  home: <Home className="h-3.5 w-3.5" />,
  diet: <Utensils className="h-3.5 w-3.5" />,
  shopping: <ShoppingBag className="h-3.5 w-3.5" />,
};

export default function CarbonFootprint() {
  const [data, setData] = useState<FootprintData>(defaultData);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("transport");

  const set = (key: keyof FootprintData, value: any) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await analyzeFootprint(data);
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Leaf className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Carbon Footprint Calculator</h1>
          <p className="text-sm text-muted-foreground">Fill in your lifestyle details to get a detailed environmental impact analysis</p>
        </div>
      </div>

      {/* FORM */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="transport" className="flex items-center gap-1.5 text-xs">
                <Car className="h-3.5 w-3.5" /> Transport
              </TabsTrigger>
              <TabsTrigger value="home" className="flex items-center gap-1.5 text-xs">
                <Home className="h-3.5 w-3.5" /> Home
              </TabsTrigger>
              <TabsTrigger value="diet" className="flex items-center gap-1.5 text-xs">
                <Utensils className="h-3.5 w-3.5" /> Diet
              </TabsTrigger>
              <TabsTrigger value="shopping" className="flex items-center gap-1.5 text-xs">
                <ShoppingBag className="h-3.5 w-3.5" /> Shopping
              </TabsTrigger>
            </TabsList>

            {/* TRANSPORT */}
            <TabsContent value="transport" className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Country / Region</Label>
                  <Input value={data.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. India" />
                </div>
                <div className="space-y-1.5">
                  <Label>Household Size</Label>
                  <Input type="number" min={1} max={20} value={data.householdSize} onChange={(e) => set("householdSize", +e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Car Type</Label>
                  <Select value={data.carType} onValueChange={(v) => set("carType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No car</SelectItem>
                      <SelectItem value="petrol">Petrol/Gasoline</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="lpg">LPG/CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Car km/week: <span className="font-semibold text-primary">{data.carKmPerWeek}</span></Label>
                  <Slider min={0} max={1000} step={10} value={[data.carKmPerWeek]} onValueChange={([v]) => set("carKmPerWeek", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Public Transport hrs/week: <span className="font-semibold text-primary">{data.publicTransportHoursPerWeek}</span></Label>
                  <Slider min={0} max={40} step={1} value={[data.publicTransportHoursPerWeek]} onValueChange={([v]) => set("publicTransportHoursPerWeek", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Motorcycle km/week: <span className="font-semibold text-primary">{data.motorcycleKmPerWeek}</span></Label>
                  <Slider min={0} max={500} step={10} value={[data.motorcycleKmPerWeek]} onValueChange={([v]) => set("motorcycleKmPerWeek", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Flights per year: <span className="font-semibold text-primary">{data.flightsPerYear}</span></Label>
                  <Slider min={0} max={30} step={1} value={[data.flightsPerYear]} onValueChange={([v]) => set("flightsPerYear", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Avg flight duration (hrs): <span className="font-semibold text-primary">{data.avgFlightHours}</span></Label>
                  <Slider min={1} max={20} step={0.5} value={[data.avgFlightHours]} onValueChange={([v]) => set("avgFlightHours", v)} />
                </div>
              </div>
            </TabsContent>

            {/* HOME */}
            <TabsContent value="home" className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Electricity kWh/month: <span className="font-semibold text-primary">{data.electricityKwhPerMonth}</span></Label>
                  <Slider min={0} max={2000} step={10} value={[data.electricityKwhPerMonth]} onValueChange={([v]) => set("electricityKwhPerMonth", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Energy Source</Label>
                  <Select value={data.energySource} onValueChange={(v) => set("energySource", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid (mixed)</SelectItem>
                      <SelectItem value="coal">Mostly coal</SelectItem>
                      <SelectItem value="renewable">Mostly renewable</SelectItem>
                      <SelectItem value="solar">Solar panels</SelectItem>
                      <SelectItem value="nuclear">Nuclear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Natural Gas units/month: <span className="font-semibold text-primary">{data.gasUsagePerMonth}</span></Label>
                  <Slider min={0} max={50} step={1} value={[data.gasUsagePerMonth]} onValueChange={([v]) => set("gasUsagePerMonth", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Home Size (sq ft): <span className="font-semibold text-primary">{data.homeSize}</span></Label>
                  <Slider min={200} max={5000} step={50} value={[data.homeSize]} onValueChange={([v]) => set("homeSize", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Heating Fuel</Label>
                  <Select value={data.heatingFuel} onValueChange={(v) => set("heatingFuel", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Not needed</SelectItem>
                      <SelectItem value="gas">Natural gas</SelectItem>
                      <SelectItem value="oil">Heating oil</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="wood">Wood/biomass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* DIET */}
            <TabsContent value="diet" className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Diet Type</Label>
                  <Select value={data.dietType} onValueChange={(v) => set("dietType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="omnivore">Omnivore (moderate meat)</SelectItem>
                      <SelectItem value="heavy_meat">Heavy meat eater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Beef/Lamb meals/week: <span className="font-semibold text-primary">{data.beefMealsPerWeek}</span></Label>
                  <Slider min={0} max={21} step={1} value={[data.beefMealsPerWeek]} onValueChange={([v]) => set("beefMealsPerWeek", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dairy servings/day: <span className="font-semibold text-primary">{data.dairyServingsPerDay}</span></Label>
                  <Slider min={0} max={10} step={0.5} value={[data.dairyServingsPerDay]} onValueChange={([v]) => set("dairyServingsPerDay", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Food Waste Level</Label>
                  <Select value={data.foodWasteLevel} onValueChange={(v) => set("foodWasteLevel", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal (very little waste)</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Local/Organic food: <span className="font-semibold text-primary">{data.localFoodPercent}%</span></Label>
                  <Slider min={0} max={100} step={5} value={[data.localFoodPercent]} onValueChange={([v]) => set("localFoodPercent", v)} />
                </div>
              </div>
            </TabsContent>

            {/* SHOPPING */}
            <TabsContent value="shopping" className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>New clothing items/month: <span className="font-semibold text-primary">{data.clothingItemsPerMonth}</span></Label>
                  <Slider min={0} max={20} step={1} value={[data.clothingItemsPerMonth]} onValueChange={([v]) => set("clothingItemsPerMonth", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Electronics purchases/year: <span className="font-semibold text-primary">{data.electronicsPerYear}</span></Label>
                  <Slider min={0} max={10} step={1} value={[data.electronicsPerYear]} onValueChange={([v]) => set("electronicsPerYear", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Online orders/month: <span className="font-semibold text-primary">{data.onlineOrdersPerMonth}</span></Label>
                  <Slider min={0} max={50} step={1} value={[data.onlineOrdersPerMonth]} onValueChange={([v]) => set("onlineOrdersPerMonth", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Recycling Habit</Label>
                  <Select value={data.recyclingHabit} onValueChange={(v) => set("recyclingHabit", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always recycle</SelectItem>
                      <SelectItem value="sometimes">Sometimes</SelectItem>
                      <SelectItem value="rarely">Rarely</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleCalculate} disabled={loading} className="gap-2 px-8">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculating...</> : <><Leaf className="h-4 w-4" /> Calculate My Footprint</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }: { result: any }) {
  const { breakdown } = result;
  const sections = [
    { key: "transport", label: "Transport", icon: <Car className="h-4 w-4" />, color: "bg-blue-500" },
    { key: "homeEnergy", label: "Home Energy", icon: <Home className="h-4 w-4" />, color: "bg-orange-500" },
    { key: "diet", label: "Diet", icon: <Utensils className="h-4 w-4" />, color: "bg-green-500" },
    { key: "shopping", label: "Shopping", icon: <ShoppingBag className="h-4 w-4" />, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-5">
      {/* SCORE CARD */}
      <Card className="border-2 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score circle */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={result.rating === "Excellent" ? "#10b981" : result.rating === "Good" ? "#22c55e" : result.rating === "Average" ? "#eab308" : result.rating === "High" ? "#f97316" : "#ef4444"}
                    strokeWidth="10"
                    strokeDasharray={`${(result.ratingScore / 100) * 264} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{result.ratingScore}</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <span className={`text-sm font-semibold ${ratingColor[result.rating] || "text-foreground"}`}>{result.rating}</span>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3 w-full">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Annual Footprint</p>
                  <p className="text-2xl font-bold">{result.totalAnnualKgCO2?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">kg CO₂e / year</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Monthly Average</p>
                  <p className="text-2xl font-bold">{result.monthlyKgCO2?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">kg CO₂e / month</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{result.comparisonToAverage}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed border-t pt-4">{result.summary}</p>
        </CardContent>
      </Card>

      {/* BREAKDOWN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Emissions Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map(({ key, label, icon, color }) => {
            const s = breakdown?.[key];
            if (!s) return null;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${color} text-white`}>{icon}</span>
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{s.kgCO2?.toLocaleString()} kg</span>
                    <span className="text-muted-foreground ml-2 text-xs">({s.percentage}%)</span>
                  </div>
                </div>
                <Progress value={s.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{s.details}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* EQUIVALENTS + TOP IMPACTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What This Means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
              <span className="text-2xl">🌳</span>
              <div>
                <p className="text-sm font-medium">{result.equivalents?.treesNeededToOffset?.toLocaleString()} trees</p>
                <p className="text-xs text-muted-foreground">needed to offset your annual footprint</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="text-sm font-medium">{result.equivalents?.kmDrivenEquivalent?.toLocaleString()} km</p>
                <p className="text-xs text-muted-foreground">equivalent driving distance</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3">
              <span className="text-2xl">✈️</span>
              <div>
                <p className="text-sm font-medium">{result.equivalents?.flightsEquivalent}</p>
                <p className="text-xs text-muted-foreground">flight equivalent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Impact Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.topImpacts?.map((impact: string, i: number) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/40 p-3">
                <span className="text-base mt-0.5">{["🔴", "🟠", "🟡"][i] || "⚪"}</span>
                <p className="text-sm">{impact}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* RECOMMENDATIONS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-500" /> Reduction Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.recommendations?.map((rec: any, i: number) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <div className="p-1.5 rounded bg-muted shrink-0 text-muted-foreground">
                {categoryIcon[rec.category] || <Leaf className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{rec.action}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Save ~{rec.potentialSavingKg?.toLocaleString()} kg CO₂e/year
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${difficultyColor[rec.difficulty] || ""}`}>
                {rec.difficulty}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
