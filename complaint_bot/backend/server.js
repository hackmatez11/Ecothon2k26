require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
const Complaint = require("./models/complaint");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend so mic works on http://localhost:3000
app.use(express.static(path.join(__dirname, "../frontend")));

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// In-memory session store
const sessions = {};

const STEPS = ["complaint", "location", "contact"];

const QUESTIONS = {
  complaint: "Please describe your complaint.",
  location:  "Where is the issue located?",
  contact:   "Please tell your contact number.",
};

// ── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function textToSpeech(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await axios.post(
    url,
    {
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(response.data).toString("base64");
}

// ── POST /start ──────────────────────────────────────────────────────────────
app.post("/start", async (req, res) => {
  const sessionId = Date.now().toString();
  sessions[sessionId] = {
    step: 0,
    data: { complaint: "", location: "", contact: "", others: "" },
  };

  try {
    const question = QUESTIONS[STEPS[0]];
    const audioBase64 = await textToSpeech(question);
    res.json({ sessionId, question, audioBase64 });
  } catch (err) {
    const detail = err.response?.data
      ? Buffer.from(err.response.data).toString()
      : err.message;
    console.error("TTS error:", detail);
    res.json({ sessionId, question: QUESTIONS[STEPS[0]], audioBase64: null });
  }
});

// ── POST /voice-input ────────────────────────────────────────────────────────
app.post("/voice-input", async (req, res) => {
  const { sessionId, text } = req.body;

  console.log(`[voice-input] sessionId=${sessionId} text="${text}"`);

  if (!sessionId || !sessions[sessionId]) {
    console.log("[voice-input] Invalid or expired session");
    return res.status(400).json({ error: "Invalid or expired session." });
  }

  const session = sessions[sessionId];
  const step = session.step;
  const data = session.data;

  console.log(`[voice-input] step=${step} data=`, data);

  // Confirmation step
  if (step === STEPS.length) {
    const confirmed = /\b(yes|yeah|yep|correct|confirm|ok|okay|sure|proceed)\b/i.test(text);
    console.log(`[voice-input] Awaiting confirmation. confirmed=${confirmed}`);

    if (confirmed) {
      try {
        console.log("[voice-input] Saving to DB:", data);
        const saved = await Complaint.create({
          complaint: data.complaint,
          location:  data.location,
          contact:   data.contact,
          others:    data.others || "",
        });
        console.log("[voice-input] Saved successfully, id:", saved._id);
        delete sessions[sessionId];
        const msg = "Your complaint has been successfully registered. Thank you!";
        const audioBase64 = await textToSpeech(msg).catch(() => null);
        return res.json({ done: true, message: msg, audioBase64 });
      } catch (err) {
        console.error("[voice-input] DB save error:", err.message);
        return res.status(500).json({ error: "Failed to save complaint: " + err.message });
      }
    } else {
      // Restart from step 0
      session.step = 0;
      session.data = { complaint: "", location: "", contact: "", others: "" };
      const question = QUESTIONS[STEPS[0]];
      const audioBase64 = await textToSpeech(question).catch(() => null);
      return res.json({ question, audioBase64 });
    }
  }

  // Store current field
  const field = STEPS[step];
  session.data[field] = text;
  session.step += 1;
  console.log(`[voice-input] Stored field "${field}"="${text}", next step=${session.step}`);

  // All fields collected — read back summary
  if (session.step === STEPS.length) {
    const summary =
      `Here is your complaint summary. ` +
      `Complaint: ${session.data.complaint}. ` +
      `Location: ${session.data.location}. ` +
      `Contact: ${session.data.contact}. ` +
      (session.data.others ? `Additional info: ${session.data.others}. ` : "") +
      `Do you confirm? Please say yes or no.`;

    const audioBase64 = await textToSpeech(summary).catch(() => null);
    return res.json({ question: summary, audioBase64, awaitingConfirmation: true });
  }

  // Ask next question
  const nextQuestion = QUESTIONS[STEPS[session.step]];
  const audioBase64 = await textToSpeech(nextQuestion).catch(() => null);
  res.json({ question: nextQuestion, audioBase64 });
});

// ── GET /complaints ──────────────────────────────────────────────────────────
app.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /others ─────────────────────────────────────────────────────────────
app.post("/others", async (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(400).json({ error: "Invalid session." });
  }
  sessions[sessionId].data.others = text;
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
