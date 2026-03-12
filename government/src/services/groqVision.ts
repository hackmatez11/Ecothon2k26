import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Convert image to base64
const convertToBase64 = (file: string) => {
  return new Promise<string>((resolve, reject) => {
    // If already a data URL, extract base64
    if (file.startsWith('data:')) {
      const base64 = file.split(",")[1];
      resolve(base64);
      return;
    }
    
    // For file objects (not used in current implementation but kept for compatibility)
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file as any);
  });
};

// MAIN FUNCTION (CUSTOM PROMPT)
export const analyzeImageWithPrompt = async (imageDataUrl: string, prompt: string) => {
  try {
    const base64Image = await convertToBase64(imageDataUrl);

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: "You are an AI vision assistant that analyzes images and provides detailed transformation plans for urban remediation.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("Groq Vision Error:", error);
    throw error;
  }
};
