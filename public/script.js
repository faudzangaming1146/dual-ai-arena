// Ganti URL di bawah dengan URL dari Realtime Database Firebase milikmu
const firebaseConfig = {
  databaseURL: "https://dual-ai-arena-default-rtdb.asia-southeast1.firebasedatabase.app/" 
};

// Inisialisasi Database
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ID Pengguna Acak untuk Identitas Chat
const userId = "User_" + Math.floor(1000 + Math.random() * 9000);

// Menerima pesan baru secara langsung dari SELURUH pengguna aktif
db.ref('global_chat').limitToLast(50).on('child_added', (snapshot) => {
  const data = snapshot.val();
  appendChatMessage(data.sender, data.text);
});

// --- LOGIKA CHAT GLOBAL ---
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
    // Memuat pesan ke database cloud agar terkirim ke semua perangkat
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
