import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with safe size limits for pasted content
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Secure API endpoint for AI deck generation
app.post("/api/generate-cards", async (req, res) => {
  try {
    const { title, description, contentText, cardCount = 10 } = req.body;

    if (!contentText || typeof contentText !== "string") {
      return res.status(400).json({ error: "Context text is required to generate cards." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add it via Settings > Secrets.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are an elite educational therapist and learning psychologist.
Your task is to ingest study notes, parsed PDF texts, or outlines, and output highly cohesive and effective flashcards for Active Recall and Spaced Repetition (conceptualized via SuperMemo SM-2).

Rules for high-quality card generation:
1. "Atomic Fronts": The front of the card must contain a single distinct question, prompt, or term. NEVER stack multiple questions.
2. "Unambiguous Backs": The back must provide a direct, precise answer. Use key terms, short bullet points, or single-sentence answers.
3. "Distill and Simplify": Filter out introductory fluff. Focus on foundational definitions, formulas, causal relationships, and key concepts.
4. "Volume Guarantee": Extract exactly ${cardCount} high-yield study cards covering different components of the text. Do not repeat concepts.
5. "Clean Content": Do NOT include any markdown code blocks or outer wrappers inside the JSON fields. Output ONLY valid string fields.`;

    const userPrompt = `Generate a set of study flashcards based on this material:
Title: ${title || "Untitled Deck"}
Description: ${description || "No description provided"}

--- SOURCE CONTENT ---
${contentText.substring(0, 80000)} // Safe guard for token limit
--- END SOURCE CONTENT ---

Please output exactly ${cardCount} flashcards.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of generated flashcards matching the source content",
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: "Question or concept name on the front of the cards. Highly scannable.",
              },
              back: {
                type: Type.STRING,
                description: "Concise, definitive answer or bulleted core details on the back.",
              },
            },
            required: ["front", "back"],
          },
        },
      },
    });

    const generatedText = response.text;
    if (!generatedText) {
      throw new Error("No flashcards returned from Gemini model.");
    }

    const cards = JSON.parse(generatedText);
    res.json({ cards });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "An unexpected server error occurred during card generation.",
    });
  }
});

// Configure Vite or production static files
const initServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Flashcards Server] Running on http://localhost:${PORT}`);
  });
};

initServer();
