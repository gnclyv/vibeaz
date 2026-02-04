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

// 1. YUXARI: Bütün istifadəçiləri "Story" stilində göstər
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

// 2. AŞAĞI: Yalnız mesaj yazışması olan şəxsləri göstər
function loadChatHistory(myUid) {
    const chatContainer = document.getElementById('chats-list-container');
    if (!chatContainer) return;

    // "participants" massivində mənim UID-m olan mesajları tapırıq
    const q = query(
        collection(db, "direct_messages"),
        where("participants", "array-contains", myUid),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        chatContainer.innerHTML = '';
        const chatteredUsers = new Set(); 

        if (snapshot.empty) {
            chatContainer.innerHTML = '<p style="text-align:center; color:#555; margin-top:20px;">Hələ ki, yazışma yoxdur.</p>';
            return;
        }

        snapshot.forEach((msgDoc) => {
            const msgData = msgDoc.data();
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
                ${userData.status === 'online' ? '<span style="color:#1ed760; font-size:10px;">●</span>' : ''}
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
