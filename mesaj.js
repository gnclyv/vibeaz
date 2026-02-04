import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase Konfiqurasiyası (Sizin proyektə özəl)
const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};
import { query, where, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

function loadActiveUsers() {
    const listContainer = document.getElementById('active-users-list');
    if (!listContainer) return;

    // Yalnız statusu "online" olanları gətir
    const q = query(collection(db, "users"), where("status", "==", "online"));

    onSnapshot(q, (snapshot) => {
        listContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const userData = doc.data();
            
            // Özümüzü siyahıda göstərmirik
            if (userData.uid !== auth.currentUser?.uid) {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.onclick = () => {
                    window.location.href = `mesaj.html?uid=${userData.uid}`;
                };
                
                const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'User'}&background=333&color=fff`;
                
                userCard.innerHTML = `
                    <div class="avatar-wrapper">
                        <img src="${userImg}" alt="Avatar">
                        <div class="status-dot"></div>
                    </div>
                    <span>${userData.displayName || 'İstifadəçi'}</span>
                `;
                listContainer.appendChild(userCard);
            }
        });
    });
}

// onAuthStateChanged daxilində çağır:
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadActiveUsers(); // Aktivləri yüklə
        // ... digər kodların
    }
});
// Firebase-i başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML Elementlərini seçirik
const msgBox = document.getElementById('chat-messages');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const inputIcons = document.getElementById('input-icons-group');

// --- INTERFEYS MƏNTİQİ ---
// Yazı yazanda "Göndər" düyməsini göstər, ikonları gizlə
input.addEventListener('input', () => {
    if (input.value.trim().length > 0) {
        sendBtn.style.display = 'block';
        if (inputIcons) inputIcons.style.display = 'none';
    } else {
        sendBtn.style.display = 'none';
        if (inputIcons) inputIcons.style.display = 'flex';
    }
});

// --- MESAJ GÖNDƏRMƏ ---
async function sendMessage() {
    const text = input.value.trim();
    const user = auth.currentUser;

    if (!text || !user) return;

    try {
        await addDoc(collection(db, "global_messages"), {
            text: text,
            senderId: user.uid,
            senderName: user.displayName || user.email.split('@')[0],
            senderPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`,
            timestamp: serverTimestamp()
        });
        
        input.value = ""; // İnputu təmizlə
        sendBtn.style.display = 'none'; // Düyməni gizlə
        if (inputIcons) inputIcons.style.display = 'flex'; // İkonları geri gətir
        
    } catch (error) {
        console.error("Mesaj göndərilərkən xəta:", error);
    }
}

// --- MESAJLARI CANLI DİNLƏMƏ (Real-time) ---
function listenForMessages() {
    const q = query(collection(db, "global_messages"), orderBy("timestamp", "asc"));
    
    onSnapshot(q, (snapshot) => {
        msgBox.innerHTML = ''; // Köhnə mesajları təmizlə ki, dublikat olmasın
        
        snapshot.forEach((doc) => {
            const message = doc.data();
            const isMine = message.senderId === auth.currentUser?.uid;
            
            // Vaxtı formatla (məs: 14:30)
            const time = message.timestamp ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            const messageDiv = document.createElement('div');
            messageDiv.className = `msg-wrapper ${isMine ? 'mine-wrapper' : 'others-wrapper'}`;
            
            messageDiv.innerHTML = `
                ${!isMine ? `<span class="sender-label">${message.senderName}</span>` : ''}
                <div class="msg ${isMine ? 'mine' : 'others'}">
                    <span>${message.text}</span>
                    <div class="msg-time">${time}</div>
                </div>
            `;
            msgBox.appendChild(messageDiv);
        });
        
        // Səhifə
