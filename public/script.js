// --- KONFIGURASI FIREBASE REALTIME CHAT ---
// Ganti nilai config di bawah dengan proyek Firebase gratis kamu jika ingin pesan tersimpan publik
const firebaseConfig = {
  databaseURL: "https://dualaiarena-default-rtdb.firebaseio.com" 
};

// Inisialisasi Firebase (jika URL terpasang)
let db = null;
try {
  if (firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes("YOUR_PROJECT")) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    
    // Mendengarkan pesan baru secara realtime
    db.ref('global_chat').limitToLast(30).on('child_added', (snapshot) => {
      const data = snapshot.val();
      appendChatMessage(data.sender, data.text);
    });
  }
} catch (e) {
  console.log("Firebase belum dihubungkan, obrolan berjalan di mode lokal.");
}

// Generasi ID Pengguna Acak
const userId = "User_" + Math.floor(1000 + Math.random() * 9000);

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
    if (db) {
      // Kirim ke Firebase
      db.ref('global_chat').push({
        sender: userId,
        text: text,
        timestamp: Date.now()
      });
    } else {
      // Mode Tampilan Lokal
      appendChatMessage('Kamu', text);
    }
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

// --- LOGIKA QUERY GEMINI AI ---
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
