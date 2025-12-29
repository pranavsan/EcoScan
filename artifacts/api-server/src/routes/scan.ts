import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ScanWasteBody, ScanWasteResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/scan", async (req, res): Promise<void> => {
  const parsed = ScanWasteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64 } = parsed.data;

  const prompt = `You are an expert environmental waste classifier. Analyze this image and classify the waste.

Respond with a JSON object with these exact fields:
- wasteType: one of "plastic", "organic", "electronic", "hazardous", "paper", "metal", "glass", "mixed", "textile", "construction"
- confidence: a number between 0 and 1 indicating your confidence
- description: a 1-2 sentence description of the waste visible in the image
- suggestions: an array of 2-3 practical disposal/recycling suggestions
- severity: one of "low", "medium", "high" based on environmental impact

Respond ONLY with valid JSON, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let result: {
    wasteType: string;
    confidence: number;
    description: string;
    suggestions: string[];
    severity: string;
  };

  try {
    result = JSON.parse(content);
  } catch {
    result = {
      wasteType: "mixed",
      confidence: 0.5,
      description: "Unable to classify waste from this image.",
      suggestions: ["Separate waste by type before disposal", "Contact local waste management for guidance"],
      severity: "medium",
    };
  }

  res.json(ScanWasteResponse.parse(result));
});

export default router;
