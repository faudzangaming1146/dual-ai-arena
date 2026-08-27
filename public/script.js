// Config Firebase Realtime Database
const firebaseConfig = {
  databaseURL: "https://dual-ai-arena-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Mengambil atau membuat ID Rahasia Perangkat (agar pemilik asli tetap bisa memakai namanya)
let deviceSecretKey = localStorage.getItem('deviceSecretKey');
if (!deviceSecretKey) {
  deviceSecretKey = 'dev_' + Math.random().toString(36).substring(2, 11);
  localStorage.setItem('deviceSecretKey', deviceSecretKey);
}

// Identitas pengguna
let userId = localStorage.getItem('chatUsername') || "User_" + Math.floor(1000 + Math.random() * 9000);
let isPrivateUnlocked = false;

// Menampilkan nama di tombol saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  updateNameButtons();
});

function updateNameButtons() {
  const nameBtn = document.getElementById('name-btn');
  const privateNameBtn = document.getElementById('private-name-btn');
  if (nameBtn) nameBtn.innerText = "👤 " + userId;
  if (privateNameBtn) privateNameBtn.innerText = "👤 " + userId;
}

// --- FUNGSI KUNCI NAMA UNIK ---
async function changeName() {
  const inputName = prompt("Masukkan nama baru kamu:", userId);
  if (!inputName || inputName.trim() === "") return;

  const newName = inputName.trim();
  const sanitizedKey = newName.toLowerCase().replace(/[.#$/[\]]/g, "_");

  try {
    // 1. Periksa klaim nama di Firebase
    const snapshot = await db.ref('claimed_names/' + sanitizedKey).once('value');
    const existingOwnerKey = snapshot.val();

    // 2. Tolak jika nama sudah diklaim oleh perangkat lain
    if (existingOwnerKey && existingOwnerKey !== deviceSecretKey) {
      alert(`⚠️ Nama "${newName}" sudah terkunci dan digunakan pengguna lain! Cari nama lain.`);
      return;
    }

    // 3. Kunci nama untuk perangkat ini
    await db.ref('claimed_names/' + sanitizedKey).set(deviceSecretKey);

    // 4. Lepaskan klaim nama lama jika bukan nama bawaan
    const oldSanitizedKey = userId.toLowerCase().replace(/[.#$/[\]]/g, "_");
    if (oldSanitizedKey !== sanitizedKey && !userId.startsWith("User_")) {
      db.ref('claimed_names/' + oldSanitizedKey).remove();
    }

    // 5. Simpan nama baru secara lokal
    userId = newName;
    localStorage.setItem('chatUsername', userId);
    updateNameButtons();
    alert(`✅ Nama "${userId}" berhasil dikunci untuk perangkat ini!`);

  } catch (err) {
    alert("Gagal memeriksa ketersediaan nama: " + err.message);
  }
}

// --- 1. CHAT GLOBAL REALTIME ---
db.ref('global_chat').limitToLast(50).on('child_added', (snapshot) => {
  const data = snapshot.val();
  appendChatMessage('chat-messages', data.sender, data.text);
});

function toggleChat() {
  const chatBox = document.getElementById('global-chat-box');
  document.getElementById('private-chat-box').classList.add('hidden');
  chatBox.classList.toggle('hidden');
}

function handleChatEnter(event) {
  if (event.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  
  if (text !== '') {
    db.ref('global_chat').push({
      sender: userId,
      text: text,
      timestamp: Date.now()
    });
    input.value = '';
  }
}

// --- 2. CHAT PRIBADI REALTIME (Proteksi Sandi) ---
db.ref('private_chat').limitToLast(50).on('child_added', (snapshot) => {
  const data = snapshot.val();
  appendChatMessage('private-chat-messages', data.sender, data.text);
});

function togglePrivateChat() {
  const privateBox = document.getElementById('private-chat-box');
  document.getElementById('global-chat-box').classList.add('hidden');

  if (privateBox.classList.contains('hidden')) {
    if (!isPrivateUnlocked) {
      const pass = prompt("Masukkan Sandi Chat Pribadi:");
      if (pass === "78900987") {
        isPrivateUnlocked = true;
        privateBox.classList.remove('hidden');
      } else if (pass !== null) {
        alert("Sandi Salah!");
      }
    } else {
      privateBox.classList.remove('hidden');
    }
  } else {
    privateBox.classList.add('hidden');
  }
}

function handlePrivateChatEnter(event) {
  if (event.key === 'Enter') sendPrivateChatMessage();
}

function sendPrivateChatMessage() {
  const input = document.getElementById('private-chat-input');
  const text = input.value.trim();
  
  if (text !== '') {
    db.ref('private_chat').push({
      sender: userId,
      text: text,
      timestamp: Date.now()
    });
    input.value = '';
  }
}

// --- FUNGSI TAMPILKAN PESAN ---
function appendChatMessage(containerId, sender, text) {
  const chatMessages = document.getElementById(containerId);
  if (!chatMessages) return;
  const msgDiv = document.createElement('div');
  msgDiv.className = 'user-msg';
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- LOGIKA UTAMA GEMINI AI ---
async function sendAiPrompt() {
  const input = document.getElementById('prompt-input');
  const box = document.getElementById('ai-response-box');
  const prompt = input.value.trim();

  if (!prompt) return;

  box.innerHTML = '<p><em>Sedang memproses respons...</em></p>';

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });

    const data = await res.json();

    if (res.ok) {
      box.innerText = data.reply;
    } else {
      box.innerText = 'Eror: ' + (data.error || 'Gagal terhubung ke AI.');
    }
  } catch (err) {
    box.innerText = 'Eror Jaringan: ' + err.message;
  }
}
