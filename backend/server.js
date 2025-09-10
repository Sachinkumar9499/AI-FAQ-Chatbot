// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();
const app = express();

// ✅ CORS: allow your Live Server origin
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// Log every request
app.use((req, res, next) => {
  console.log("📡 Incoming:", req.method, req.url);
  next();
});

app.use(bodyParser.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Server is alive");
});

// Sample FAQ data (expand as needed)
const faqData = [
  { question: "refund", answer: "We offer a 7-day full refund." },
  { question: "password", answer: "Use 'Forgot Password' to reset it." },
  { question: "support", answer: "Yes — 24/7 support via chat and email." }
];

// Utility: simple keyword matcher
function findAnswer(userQuestion) {
  if (!userQuestion) return null;
  const q = userQuestion.toLowerCase();
  for (const f of faqData) {
    const keyword = f.question.toLowerCase().split(" ")[0];
    if (q.includes(keyword)) return f.answer;
  }
  return null;
}

// ✅ POST /ask route
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    console.log("📩 Received question:", question);

    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    let answer = findAnswer(question);

    if (!answer) {
      // Fallback: use OpenAI if API key is set
      if (process.env.OPENAI_API_KEY) {
        try {
          const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: question }]
          });
          answer = response.choices[0].message.content;
        } catch (err) {
          console.error("❌ OpenAI error:", err.message);
          answer = "Sorry, I couldn't process your question.";
        }
      } else {
        // No API key, just return a placeholder
        answer = "I don't know that yet — but I'll learn!";
      }

      // Save unanswered for training
      try {
        fs.appendFileSync("unanswered.json", JSON.stringify({ question }) + "\n");
      } catch (err) {
        console.error("⚠️ Could not save unanswered:", err.message);
      }
    }

    console.log("✅ Sending answer:", answer);
    return res.json({ answer });
  } catch (err) {
    console.error("🔥 /ask handler crashed:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start server on 8080 (not 5000 — ControlCenter uses 5000 on macOS)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
