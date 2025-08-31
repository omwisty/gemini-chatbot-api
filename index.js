import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const upload = multer();

// ================== CONFIG ==================
const PORT = process.env.PORT || 3000;
const MODEL_NAME = 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// middleware
app.use(cors());
app.use(express.json());

// serve static files (frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// ================== HELPERS ==================
const getText = (resp) =>
  resp?.response?.text?.() ??
  resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
  '';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Generic handler for multimodal generation (image, doc, audio)
 */
const handleGenerate = (field, defaultPrompt) =>
  asyncHandler(async (req, res) => {
    const { prompt = defaultPrompt } = req.body;
    const base64 = req.file.buffer.toString('base64');

    const resp = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: req.file.mimetype, data: base64 } }
        ]
      }]
    });

    res.json({ result: getText(resp) });
  });

// ================== ROUTES ==================

// 1) TEXT
app.post('/generate-text', asyncHandler(async (req, res) => {
  const { prompt = '' } = req.body;
  const resp = await model.generateContent(prompt);
  res.json({ result: getText(resp) });
}));

// 2) IMAGE
app.post('/generate-from-image',
  upload.single('image'),
  handleGenerate('image', '')
);

// 3) DOCUMENT
app.post('/generate-from-document',
  upload.single('document'),
  handleGenerate('document', 'Ringkas dokumen berikut:')
);

// 4) AUDIO
app.post('/generate-from-audio',
  upload.single('audio'),
  handleGenerate('audio', 'Transkrip audio berikut:')
);

// 5) CHAT
app.post('/api/chat', asyncHandler(async (req, res) => {
  const { messages = [] } = req.body;
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages[] is required' });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '') }]
  }));

  const last = messages[messages.length - 1];
  if ((last.role ?? 'user') !== 'user')
    return res.status(400).json({ error: "Last message must have role 'user'." });

  const chat = model.startChat({ history });
  const resp = await chat.sendMessage(String(last.content ?? ''));
  res.json({ result: getText(resp) });
}));

// ================== ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? String(err) });
});

// ================== START ==================
app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}`)
);