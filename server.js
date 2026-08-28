const express = require('express');
const path = require('path');
const app = express();

// Menentukan port server (default: 3000)
const PORT = process.env.PORT || 3000;

// Melayani berkas statis (index.html, CSS, gambar, JS) dari folder ini
app.use(express.static(path.join(__dirname)));

// Mengarahkan semua akses web langsung ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});
