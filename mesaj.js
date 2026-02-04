import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// 1. YUXARI: Bütün istifadəçiləri avatarları ilə göstər
function loadActiveUsers(myUid) {
    const activeList = document.getElementById('active-users-list');
    if (!activeList) return;

    onSnapshot(collection(db, "users"), (snap) => {
        activeList.innerHTML = '';
        snap.forEach(userDoc => {
            const user = userDoc.data();
            if (user.uid === myUid) return;
            
            const userImg = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=333&color=fff`;
            
            activeList.innerHTML += `
                <div class="active-user-card" onclick="window.location.href='chat.html?uid=${user.uid}'">
                    <div class="avatar-ring">
                        <img src="${userImg}">
                        ${user.status === 'online' ? '<div class="online-indicator"></div>' : ''}
                    </div>
                    <span class="active-user-name">${user.displayName || 'İstifadəçi'}</span>
                </div>`;
        });
    });
}

// 2. AŞAĞI: Yalnız mesaj yazışması olan otaqları (chats) göstər
function loadChatHistory(myUid) {
    const chatContainer = document.getElementById('chats-list-container');
    if (!chatContainer) return;

    // 'direct_messages' kolleksiyasını dinləyirik ki, kiminlə mesajımız var tapaq
    // Daha yaxşı performans üçün Firestore-da 'chats' kolleksiyası yaratmağın məsləhətdir
    const q = query(
        collection(db, "direct_messages"),
        where("participants", "array-contains", myUid),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, async (snapshot) => {
        chatContainer.innerHTML = '';
        const chatteredUsers = new Set(); // Eyni adamın adının təkrar çıxmaması üçün

        if (snapshot.empty) {
            chatContainer.innerHTML = '<p style="text-align:center; color:#555; margin-top:20px;">Hələ ki, yazışma yoxdur.</p>';
            return;
        }

        snapshot.forEach((msgDoc) => {
            const msgData = msgDoc.data();
            // Mesajdakı digər şəxsin UID-sini tapırıq
            const otherUid = msgData.senderId === myUid ? msgData.receiverId : msgData.senderId;

            if (!chatteredUsers.has(otherUid)) {
                chatteredUsers.add(otherUid);
                renderChatItem(otherUid, msgData.text, chatContainer);
            }
        });
    });
}

// Çat kartını ekrana çıxaran köməkçi funksiya
async function renderChatItem(uid, lastMsg, container) {
    // Digər istifadəçinin məlumatlarını gətiririk
    onSnapshot(doc(db, "users", uid), (userDoc) => {
        const userData = userDoc.data();
        if (!userData) return;

        // Əgər bu istifadəçi üçün artıq kart varsa, köhnəsini silirik (yenilənmə üçün)
        const oldItem = document.getElementById(`chat-${uid}`);
        if (oldItem) oldItem.remove();

        const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}`;
        
        const chatItem = document.createElement('a');
        chatItem.id = `chat-${uid}`;
        chatItem.className = 'chat-item';
        chatItem.href = `chat.html?uid=${uid}`;
        chatItem.innerHTML = `
            <img src="${userImg}" class="chat-avatar">
            <div class="chat-info">
                <h4>${userData.displayName || 'İstifadəçi'}</h4>
                <p>${lastMsg.substring(0, 30)}${lastMsg.length > 30 ? '...' : ''}</p>
            </div>
            <div class="chat-meta">
                <i class="fa-solid fa-chevron-right" style="font-size: 12px; color: #333;"></i>
            </div>
        `;
        container.appendChild(chatItem);
    });
}

// 3. GİRİŞ YOXLANIŞI
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await updateDoc(doc(db, "users", user.uid), { status: "online" });
        loadActiveUsers(user.uid);
        loadChatHistory(user.uid);
    } else {
        window.location.href = "login.html";
    }
});
