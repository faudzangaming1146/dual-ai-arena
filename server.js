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

// Endpoint ChatGPT
app.post('/api/chatgpt', async (req, res) => {
  try {
    const { message, image } = req.body;
    let content = [];

    if (message) content.push({ type: 'text', text: message });
    if (image) content.push({ type: 'image_url', image_url: { url: image } });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Gagal menghubungi ChatGPT' });
  }
});

// Endpoint Gemini
app.post('/api/gemini', async (req, res) => {
  try {
    const { message, image } = req.body;
    let parts = [];

    if (message) parts.push({ text: message });
    if (image) {
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    res.json({ reply: data.candidates[0].content.parts[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Gagal menghubungi Gemini' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
}

module.exports = app;
