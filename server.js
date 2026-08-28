<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Information Chat & AI</title>
  <style>
    * { box-sizing: border-box; font-family: sans-serif; margin: 0; padding: 0; }
    body { background-color: #0f172a; color: #f8fafc; display: flex; height: 100vh; }
    
    /* Sidebar */
    .sidebar { width: 220px; background-color: #1e293b; padding: 20px; display: flex; flex-direction: column; gap: 20px; border-right: 1px solid #334155; }
    .sidebar button { background: none; border: none; color: #94a3b8; padding: 10px; text-align: left; cursor: pointer; border-radius: 8px; }
    .sidebar button.active, .sidebar button:hover { background-color: #334155; color: #fff; }
    
    /* Main Area */
    .main-content { flex: 1; display: flex; flex-direction: column; }
    .navbar { height: 60px; background-color: #1e293b; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
    
    .chat-container { flex: 1; padding: 20px; display: flex; flex-direction: column; overflow-y: auto; }
    .chat-messages { flex: 1; background: #1e293b; border-radius: 8px; padding: 15px; overflow-y: auto; margin-bottom: 15px; border: 1px solid #334155; }
    
    .chat-input-area { display: flex; gap: 10px; }
    .chat-input-area input { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; }
    .btn { padding: 12px 20px; border: none; border-radius: 6px; background: #3b82f6; color: white; font-weight: bold; cursor: pointer; }
    .btn:hover { opacity: 0.9; }
    
    .btn-admin { background: #f59e0b; width: 100%; margin-top: 10px; display: none; }
    .admin-badge { background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 5px; }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <div class="sidebar">
    <h3>Information Chat</h3>
    <button class="active">Pesan</button>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <div class="navbar">
      <h2>Information Chat & AI</h2>
      <div>
        <span>NAMA AKUN: </span>
        <button id="user-display-name" class="btn" style="background:#334155;" onclick="changeName()">Loading...</button>
      </div>
    </div>

    <!-- Area Obrolan -->
    <div class="chat-container">
      <div class="chat-messages" id="global-chat-messages">
        <!-- Pesan akan dimuat di sini secara otomatis -->
      </div>
      
      <div class="chat-input-area">
        <input type="text" id="global-chat-input" placeholder="Tanyakan sesuatu atau ketik pesan..." onkeydown="if(event.key==='Enter') sendChatMessage()">
        <button class="btn" onclick="sendChatMessage()">Kirim</button>
      </div>

      <!-- Tombol Admin Broadcast (Otomatis muncul jika logged in sebagai admin) -->
      <button id="admin-broadcast-btn" class="btn btn-admin" onclick="openAdminBroadcast()">
        📢 Kirim Pengumuman Admin
      </button>
    </div>
  </div>

  <!-- SDK Firebase CDN (v8 Compatibility) -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>

  <script>
    // 1. Konfigurasi Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyD6OStWOzG9HfLVP1d0hSROPThIw4SjZ1g",
      databaseURL: "https://dual-ai-arena-default-rtdb.asia-southeast1.firebasedatabase.app"
    };

    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const auth = firebase.auth();

    // Salin UID Firebase milik akun admin kamu di sini
    const ADMIN_UID = "GVggSaOx8yOE7GTAtQjOvm52Brs2"; 

    let currentUsername = "User";
    let nameClickCount = 0;

    // 2. Autentikasi Anonim Otomatis & Deteksi Admin
    auth.signInAnonymously().catch(err => console.error("Auth error:", err));

    auth.onAuthStateChanged((user) => {
      if (user) {
        // Cek nama pengguna yang sudah disimpan sebelumnya
        db.ref("users/" + user.uid).once("value", (snapshot) => {
          if (snapshot.exists()) {
            currentUsername = snapshot.val().name;
          } else {
            currentUsername = "User_" + user.uid.substr(0, 4);
            db.ref("users/" + user.uid).set({ name: currentUsername });
          }
          document.getElementById("user-display-name").innerText = currentUsername;
        });

        // Tampilkan tombol admin jika UID cocok
        if (user.uid === ADMIN_UID) {
          document.getElementById("admin-broadcast-btn").style.display = "block";
        } else {
          document.getElementById("admin-broadcast-btn").style.display = "none";
        }
      }
    });

    // 3. Fungsi Ubah Nama
    function changeName() {
      nameClickCount++;
      const newName = prompt("Masukkan nama pengguna baru:");
      if (newName && newName.trim() !== "") {
        currentUsername = newName.trim();
        const currentUser = auth.currentUser;
        if (currentUser) {
          db.ref("users/" + currentUser.uid).update({ name: currentUsername });
        }
        document.getElementById("user-display-name").innerText = currentUsername;
      }
    }

    // 4. Kirim Pesan Global Biasa
    function sendChatMessage() {
      const input = document.getElementById("global-chat-input");
      const message = input.value.trim();
      if (!message) return;

      db.ref("global_chat").push({
        sender: currentUsername,
        message: message,
        timestamp: Date.now(),
        isAdmin: false
      });

      input.value = "";
    }

    // 5. Kirim Broadcast Admin Khusus
    function openAdminBroadcast() {
      const categoryChoice = prompt(
        "Pilih jenis pengumuman:\n1. Update Sistem\n2. Fitur Baru\n3. Tampilan\n4. Keamanan\n\nKetik angka (1-4):"
      );
      
      let categoryName = "";
      switch(categoryChoice) {
        case "1": categoryName = "Update Sistem"; break;
        case "2": categoryName = "Fitur Baru"; break;
        case "3": categoryName = "Tampilan"; break;
        case "4": categoryName = "Keamanan"; break;
        default: alert("Pilihan tidak valid!"); return;
      }

      const version = prompt(`Masukkan nomor versi ${categoryName} (Contoh: 6.7):`);
      if (!version) return;

      const messageContent = prompt("Masukkan isi pengumuman:");
      if (!messageContent) return;

      const finalMessage = `📢 [PENGUMUMAN ADMIN - ${categoryName} ${version}]\n${messageContent}`;

      db.ref("global_chat").push({
        sender: "ADMIN",
        message: finalMessage,
        timestamp: Date.now(),
        isAdmin: true
      }).then(() => {
        alert("Pengumuman berhasil dikirim ke seluruh pengguna!");
      });
    }

    // 6. Mendengarkan Pesan Masuk Realtime
    db.ref("global_chat").on("child_added", (snapshot) => {
      const data = snapshot.val();
      const container = document.getElementById("global-chat-messages");
      
      const msgDiv = document.createElement("div");
      msgDiv.style.marginBottom = "10px";
      
      if (data.isAdmin) {
        msgDiv.innerHTML = `<span class="admin-badge">ADMIN</span> <strong>${data.sender}:</strong> <div style="color: #f59e0b; font-weight: bold; white-space: pre-wrap;">${data.message}</div>`;
      } else {
        msgDiv.innerHTML = `<strong>${data.sender}:</strong> <span>${data.message}</span>`;
      }
      
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
    });
  </script>
</body>
</html>
