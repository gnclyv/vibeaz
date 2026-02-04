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

const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');

const msgDisplay = document.getElementById('messages-display');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');

// Qarşı tərəfin məlumatlarını və profil şəklini yükləyən funksiya
async function loadTargetUserInfo() {
    if (!targetUid) return;
    
    const userRef = doc(db, "users", targetUid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Elementləri tapırıq
        const nameEl = document.getElementById('target-user-name');
        const imgEl = document.getElementById('target-user-img');
        const statusEl = document.getElementById('target-status');

        // Ad və Şəkil
        if (nameEl) nameEl.innerText = data.displayName || "İstifadəçi";
        if (imgEl) imgEl.src = data.photoURL || `https://ui-avatars.com/api/?name=${data.displayName || 'U'}&background=333&color=fff`;
        
        // Online/Offline statusu
        if (statusEl) {
            statusEl.innerText = data.status === 'online' ? 'aktiv' : 'oflayn';
            statusEl.style.color = data.status === 'online' ? '#1ed760' : '#8e8e8e';
        }
    }
}

// Mesajları real-vaxt rejimində dinləyən funksiya
function listenMessages(currentUid) {
    if (!targetUid) return;

    const chatId = [currentUid, targetUid].sort().join('_');
    const q = query(
        collection(db, "direct_messages"),
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, (snapshot) => {
        msgDisplay.innerHTML = ''; // Köhnə mesajları təmizlə
        snapshot.forEach((doc) => {
            const msgData = doc.data();
            const msgDiv = document.createElement('div');
            
            // Premium CSS klasslarını tətbiq edirik
            msgDiv.className = `msg ${msgData.senderId === currentUid ? 'sent' : 'received'}`;
            msgDiv.innerText = msgData.text;
            
            msgDisplay.appendChild(msgDiv);
        });
        
        // Mesaj gələndə avtomatik aşağı düş (smooth scroll)
        msgDisplay.scrollTo({
            top: msgDisplay.scrollHeight,
            behavior: 'smooth'
        });
    });
}

// Mesaj göndərmə hadisəsi
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text || !auth.currentUser || !targetUid) return;

    const currentUid = auth.currentUser.uid;
    const chatId = [currentUid, targetUid].sort().join('_');
    msgInput.value = ''; // Inputu dərhal təmizləyirik

    try {
        await addDoc(collection(db, "direct_messages"), {
            chatId: chatId,
            senderId: currentUid,
            receiverId: targetUid,
            text: text,
            createdAt: serverTimestamp(),
            participants: [currentUid, targetUid] 
        });
    } catch (error) {
        console.error("Mesaj göndərilərkən xəta:", error);
    }
});

// Giriş statusunu yoxla və çat-ı başlat
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadTargetUserInfo();
        listenMessages(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});
