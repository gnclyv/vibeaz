import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const msgBox = document.getElementById('chat-messages');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const inputTools = document.getElementById('input-tools');

// Input yazılarkən düyməni dəyiş
input.addEventListener('input', () => {
    if (input.value.trim().length > 0) {
        sendBtn.style.display = 'block';
        inputTools.style.display = 'none';
    } else {
        sendBtn.style.display = 'none';
        inputTools.style.display = 'flex';
    }
});

// Mesaj Göndərmə
async function sendMessage() {
    const text = input.value.trim();
    const user = auth.currentUser;
    if (!text || !user) return;

    try {
        await addDoc(collection(db, "global_messages"), {
            text: text,
            senderId: user.uid,
            senderName: user.displayName || user.email.split('@')[0],
            timestamp: serverTimestamp()
        });
        input.value = "";
        sendBtn.style.display = 'none';
        inputTools.style.display = 'flex';
    } catch (e) {
        console.error("Xəta:", e);
    }
}

// Mesajları Dinləmə (Real-time)
function listenMessages() {
    const q = query(collection(db, "global_messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snap) => {
        msgBox.innerHTML = '';
        snap.forEach(d => {
            const m = d.data();
            const isMine = m.senderId === auth.currentUser?.uid;
            const time = m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

            const msgHtml = `
                <div class="msg-container">
                    ${!isMine ? `<span class="sender-name">${m.senderName}</span>` : ''}
                    <div class="msg ${isMine ? 'mine' : 'others'}" ondblclick="alert('Bəyənildi! ❤️')">
                        <span>${m.text}</span>
                        <div class="msg-time">${time}</div>
                    </div>
                </div>
            `;
            msgBox.innerHTML += msgHtml;
        });
        msgBox.scrollTop = msgBox.scrollHeight;
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        listenMessages();
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    } else {
        window.location.href = "login.html";
    }
});
