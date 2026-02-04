import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// 1. YUXARI: Bütün istifadəçilər (Aktiv Bar)
function loadActiveUsers(myUid) {
    const activeList = document.getElementById('active-users-list');
    if (!activeList) return;

    onSnapshot(collection(db, "users"), (snap) => {
        activeList.innerHTML = '';
        snap.forEach(userDoc => {
            const user = userDoc.data();
            if (user.uid === myUid) return;
            
            const userImg = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=333&color=fff`;
            
            // Sənin HTML stilinə uyğun struktur
            activeList.innerHTML += `
                <div class="active-u" onclick="window.location.href='chat.html?uid=${user.uid}'">
                    <img src="${userImg}">
                    ${user.status === 'online' ? '<div class="dot"></div>' : ''}
                    <span>${user.displayName || 'İstifadəçi'}</span>
                </div>`;
        });
    });
}

// 2. AŞAĞI: Yazışma Keçmişi (Söhbət Siyahısı)
function loadChatHistory(myUid) {
    const chatContainer = document.getElementById('chat-list-container'); // HTML ilə eyni ID
    if (!chatContainer) return;

    // "participants" filtrini işlədirik (İndeks xətası olmasın deyə orderBy sildik)
    const q = query(
        collection(db, "direct_messages"),
        where("participants", "array-contains", myUid)
    );

    onSnapshot(q, (snapshot) => {
        chatContainer.innerHTML = '';
        const chatteredUsers = new Set(); 
        let messages = [];

        snapshot.forEach(doc => messages.push(doc.data()));

        // JS tərəfində vaxta görə sıralayırıq (İndeks tələb olunmur)
        messages.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (messages.length === 0) {
            chatContainer.innerHTML = '<p style="text-align:center; color:#555; margin-top:30px; font-size:13px;">Hələ ki, yazışma yoxdur.</p>';
            return;
        }

        messages.forEach((msgData) => {
            const otherUid = msgData.senderId === myUid ? msgData.receiverId : msgData.senderId;

            if (!chatteredUsers.has(otherUid)) {
                chatteredUsers.add(otherUid);
                renderChatItem(otherUid, msgData.text, chatContainer);
            }
        });
    });
}

async function renderChatItem(uid, lastMsg, container) {
    onSnapshot(doc(db, "users", uid), (userDoc) => {
        const userData = userDoc.data();
        if (!userData) return;

        let existingItem = document.getElementById(`chat-item-${uid}`);
        if (existingItem) existingItem.remove();

        const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}`;
        
        const chatItem = document.createElement('a');
        chatItem.id = `chat-item-${uid}`;
        chatItem.className = 'chat-item';
        chatItem.href = `chat.html?uid=${uid}`;
        chatItem.innerHTML = `
            <img src="${userImg}" class="chat-img">
            <div class="chat-info">
                <h4>${userData.displayName || 'İstifadəçi'}</h4>
                <p>${lastMsg.substring(0, 35)}${lastMsg.length > 35 ? '...' : ''}</p>
            </div>
        `;
        container.appendChild(chatItem);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        updateDoc(doc(db, "users", user.uid), { status: "online" });
        loadActiveUsers(user.uid);
        loadChatHistory(user.uid);
    } else {
        window.location.href = "login.html";
    }
});
