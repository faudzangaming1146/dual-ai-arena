// Config Firebase Realtime Database
const firebaseConfig = {
  databaseURL: "https://dual-ai-arena-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Mengambil nama tersimpan dari browser atau membuat ID acak default
let userId = localStorage.getItem('chatUsername') || "User_" + Math.floor(1000 + Math.random() * 9000);

// Menampilkan nama di tombol saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  const nameBtn = document.getElementById('name-btn');
  if (nameBtn) nameBtn.innerText = "👤 " + userId;
});

// Fungsi untuk mengganti nama dari tombol
function changeName() {
  const newName = prompt("Masukkan nama baru kamu:", userId);
  if (newName && newName.trim() !== "") {
    userId = newName.trim();
    localStorage.setItem('chatUsername', userId);
    document.getElementById('name-btn').innerText = "👤 " + userId;
  }
}

// Menerima pesan baru secara langsung dari SELURUH pengguna aktif
db.ref('global_chat').limitToLast(50).on('child_added', (snapshot) => {
  const data = snapshot.val();
  appendChatMessage(data.sender, data.text);
});

// LOGIKA CHAT GLOBAL
function toggleChat() {
  const chatBox = document.getElementById('global-chat-box');
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

function appendChatMessage(sender, text) {
  const chatMessages = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'user-msg';
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// LOGIKA UTAMA GEMINI AI
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
