const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Melayani file dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Mengarahkan ke index.html di dalam folder 'public'
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
