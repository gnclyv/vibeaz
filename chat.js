import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// 1. URL-dən qarşı tərəfin UID-ni götürürük
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');

if (!targetUid) {
    window.location.href = 'mesaj.html';
}

const msgDisplay = document.getElementById('messages-display');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');

// 2. QARŞI TƏRƏFİN MƏLUMATLARINI GƏTİR (Header üçün)
async function loadTargetUserInfo() {
    const userRef = doc(db, "users", targetUid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const data = userSnap.data();
        document.getElementById('target-user-name').innerText = data.displayName || "İstifadəçi";
        document.getElementById('target-user-img').src = data.photoURL || "https://ui-avatars.com/api/?name=U";
        document.getElementById('target-status').innerText = data.status === 'online' ? 'hazırda aktiv' : 'oflayn';
        document.getElementById('target-status').style.color = data.status === 'online' ? '#1ed760' : '#8e8e8e';
    }
}

// 3. MESAJLARI REAL ZAMANLI DİNLƏ (onSnapshot)
function listenMessages(currentUid) {
    // Sənə gələn və sənin göndərdiyin mesajları tapmaq üçün kombinasiya edilmiş ID (Chat Room)
    const chatId = [currentUid, targetUid].sort().join('_');

    const q = query(
        collection(db, "direct_messages"),
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, (snapshot) => {
        msgDisplay.innerHTML = '';
        snapshot.forEach((doc) => {
            const msgData = doc.data();
            const msgDiv = document.createElement('div');
            
            // Mesajı göndərən mənəmsə 'sent', qarşı tərəfdirsə 'received'
            msgDiv.className = `msg ${msgData.senderId === currentUid ? 'sent' : 'received'}`;
            msgDiv.innerText = msgData.text;
            msgDisplay.appendChild(msgDiv);
        });
        // Mesaj gələndə ən aşağıya sürüşdür
        msgDisplay.scrollTop = msgDisplay.scrollHeight;
    });
}

// 4. MESAJ GÖNDƏRMƏ FUNKSİYASI
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text || !auth.currentUser) return;

    const currentUid = auth.currentUser.uid;
    const chatId = [currentUid, targetUid].sort().join('_');

    msgInput.value = ''; // Inputu dərhal təmizlə

    try {
        await addDoc(collection(db, "direct_messages"), {
            chatId: chatId,
            senderId: currentUid,
            receiverId: targetUid,
            text: text,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Mesaj göndərilmədi:", error);
    }
});

// GİRİŞ YOXLANIŞI
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadTargetUserInfo();
        listenMessages(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});
