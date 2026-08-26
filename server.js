const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Daftar API Key Cadangan
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2
].filter(Boolean);

app.post('/api/gemini', async (req, res) => {
  try {
    const { message, image } = req.body;
    let parts = [];

    if (message) parts.push({ text: message });
    if (image) {
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];
      parts.push({
        inlineData: { mimeType, data: base64Data }
      });
    }

    let lastError = null;

    // Sistem Rotasi API Key Otomatis
    for (const key of API_KEYS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          lastError = data.error?.message || `HTTP status: ${response.status}`;
          continue; 
        }

        return res.json({ reply: data.candidates[0].content.parts[0].text });
      } catch (err) {
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'Semua kuota API Key sedang mencapai limit.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

module.exports = app;
