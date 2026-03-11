import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

const SoilAnalysis = () => {
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Soil Pollution Analysis</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Mountain className="h-5 w-5 text-primary" /> Upload Soil Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Upload soil test report (PDF, Image)</p>
              <p className="text-xs text-muted-foreground mt-1">Max file size: 10MB</p>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="Enter sample collection location" />
            </div>
            <div className="space-y-2">
              <Label>Sample Date</Label>
              <Input type="date" />
            </div>
            <Button className="w-full" onClick={() => setAnalyzed(true)}>Analyze Soil Report</Button>
          </CardContent>
        </Card>

        {analyzed && (
          <Card>
            <CardHeader><CardTitle>Analysis Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="font-semibold text-foreground">Soil Health: Moderate</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "pH Level", value: "6.8", status: "Normal" },
                    { label: "Nitrogen", value: "Low", status: "Deficient" },
                    { label: "Phosphorus", value: "Medium", status: "Adequate" },
                    { label: "Potassium", value: "High", status: "Good" },
                    { label: "Organic Carbon", value: "0.5%", status: "Low" },
                    { label: "Heavy Metals", value: "Within Limits", status: "Safe" },
                  ].map((m) => (
                    <div key={m.label} className="p-2 rounded bg-card border border-border">
                      <p className="text-muted-foreground">{m.label}</p>
                      <p className="font-semibold text-foreground">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-semibold text-foreground">Crop Recommendations</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong className="text-foreground">Wheat</strong> - Suitable for current pH and nutrient levels</li>
                  <li>• <strong className="text-foreground">Mustard</strong> - Good match for potassium-rich soil</li>
                  <li>• <strong className="text-foreground">Pulses (Lentils)</strong> - Will help fix nitrogen naturally</li>
                  <li>• <strong className="text-foreground">Avoid:</strong> Rice (low nitrogen may reduce yield)</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <p className="font-semibold text-foreground mb-2">Recommendations</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Add nitrogen-rich fertilizers (urea or organic compost)</li>
                  <li>• Increase organic matter through crop residue management</li>
                  <li>• Conduct re-testing in 3 months</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SoilAnalysis;
