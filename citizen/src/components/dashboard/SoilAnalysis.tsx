import { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface AnalysisResult {
  summary: string;
  details: {
    soilType?: string;
    pH?: string;
    nutrients?: string;
    recommendations?: string;
    crops?: string;
    concerns?: string;
  };
}

export function SoilAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please upload an image (JPG, PNG, WEBP) or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setAnalysis(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const analyzeWithGroq = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    setLoading(true);
    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!groqApiKey) {
        throw new Error("Groq API key not configured");
      }

      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      // Prepare the prompt
      const prompt = `You are an expert soil scientist. Analyze this soil report and provide a comprehensive analysis including:
      
1. Soil Type and Classification
2. pH Level and its implications
3. Nutrient Content (NPK, micronutrients)
4. Recommendations for improvement
5. Suitable crops for this soil
6. Any concerns or issues detected

Please provide detailed, actionable insights in a structured format.`;

      // Call Groq API with vision model
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
           messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to analyze soil report');
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;

      if (!analysisText) {
        throw new Error('No analysis received from AI');
      }

      // Parse the analysis into structured format
      const parsedAnalysis = parseAnalysis(analysisText);
      setAnalysis(parsedAnalysis);
      toast.success("Soil analysis completed successfully!");

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze soil report");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const parseAnalysis = (text: string): AnalysisResult => {
    // Simple parsing logic - can be enhanced
    const sections = {
      soilType: extractSection(text, ['soil type', 'classification']),
      pH: extractSection(text, ['ph level', 'ph:', 'acidity']),
      nutrients: extractSection(text, ['nutrient', 'npk', 'nitrogen', 'phosphorus', 'potassium']),
      recommendations: extractSection(text, ['recommendation', 'improve', 'suggest']),
      crops: extractSection(text, ['crop', 'suitable', 'plant']),
      concerns: extractSection(text, ['concern', 'issue', 'problem', 'warning']),
    };

    return {
      summary: text.substring(0, 300) + '...',
      details: sections,
    };
  };

  const extractSection = (text: string, keywords: string[]): string => {
    const lines = text.split('\n');
    const relevantLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(keyword => line.includes(keyword))) {
        relevantLines.push(lines[i]);
        // Get next 2-3 lines for context
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          if (lines[i + j].trim()) {
            relevantLines.push(lines[i + j]);
          }
        }
        break;
      }
    }
    
    return relevantLines.join(' ').trim() || 'Not specified in the report';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Soil Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Upload your soil report or photo for AI-powered analysis and recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Soil Report</CardTitle>
          <CardDescription>
            Upload an image or PDF of your soil test report for detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="soil-upload"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="soil-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: JPG, PNG, WEBP, PDF (Max 10MB)
                  </p>
                </div>
              </div>
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {file.type.startsWith('image/') ? (
                <ImageIcon className="w-5 h-5 text-primary" />
              ) : (
                <FileText className="w-5 h-5 text-primary" />
              )}
              <span className="text-sm flex-1">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setAnalysis(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}

          <Button
            onClick={analyzeWithGroq}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Analyze Soil Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {analysis.summary}
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              {analysis.details.soilType && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Soil Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.details.soilType}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.details.pH && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">pH Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.details.pH}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.details.nutrients && (
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Nutrient Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.details.nutrients}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.details.recommendations && (
                <Card className="md:col-span-2 border-green-500/20 bg-green-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.details.recommendations}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.details.crops && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Suitable Crops</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.details.crops}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.details.concerns && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Concerns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.details.concerns}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
