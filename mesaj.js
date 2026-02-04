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

async function sendMessage() {
    const text = input.value.trim();
    const user = auth.currentUser;
    if (!text || !user) return;

    try {
        await addDoc(collection(db, "global_chat"), {
            text: text,
            senderId: user.uid,
            senderName: user.displayName || user.email.split('@')[0],
            timestamp: serverTimestamp()
        });
        input.value = "";
    } catch (e) { console.error("Error:", e); }
}

// mesaj.js içindəki əsas hissə
function initChat() {
    // Mesajları zaman sırasına görə düzürük
    const q = query(collection(db, "global_messages"), orderBy("timestamp", "asc"));
    
    // onSnapshot bazada dəyişiklik olanda dərhal işə düşür
    onSnapshot(q, (snap) => {
        msgBox.innerHTML = ''; // Köhnə mesajları təmizlə
        snap.forEach(d => {
            const m = d.data();
            const isMine = m.senderId === auth.currentUser?.uid;
            
            // Mesajı ekrana çıxar
            msgBox.innerHTML += `
                <div class="msg ${isMine ? 'mine' : 'others'}">
                    <small>${isMine ? 'Siz' : m.senderName}</small>
                    <span>${m.text}</span>
                </div>`;
        });
        // Həmişə ən son mesajı göstərmək üçün aşağı sürüşdür
        msgBox.scrollTop = msgBox.scrollHeight;
    });
}
