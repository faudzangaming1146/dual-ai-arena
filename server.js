const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
// Meningkatkan batas ukuran request agar bisa menerima data gambar
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chatgpt', async (req, res) => {
  try {
    const { message, image } = req.body;
    let content = [];
    if (message) content.push({ type: "text", text: message });
    if (image) content.push({ type: "image_url", image_url: { url: image } });

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
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
  res.status(500).json({ error: err.message });
}

module.exports = app;
    res.status(500).json({ error: err.message || 'Gagal menghubungi Gemini' });
  }
});

app.listen(3000, () => console.log('Server berjalan di http://localhost:3000'));
