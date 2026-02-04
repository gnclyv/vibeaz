import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase Konfiqurasiyası (Sənin məlumatların)
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

// 1. YUXARI BÖLMƏ: Aktiv Dostlar Siyahısı (Yaşıl nöqtə ilə)
function loadActiveUsers(myUid) {
    const activeList = document.getElementById('active-users-list');
    if (!activeList) return;

    onSnapshot(collection(db, "users"), (snap) => {
        activeList.innerHTML = '';
        snap.forEach(userDoc => {
            const user = userDoc.data();
            if (user.uid === myUid) return; // Özümüzü siyahıda göstərmirik
            
            const userImg = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=333&color=fff`;
            
            const userDiv = document.createElement('div');
            userDiv.className = 'active-u';
            userDiv.onclick = () => window.location.href = `chat.html?uid=${user.uid}`;
            
            // Avatar konteyneri və yaşıl status nöqtəsi
            userDiv.innerHTML = `
                <div class="avatar-container" style="position: relative; display: inline-block;">
                    <img src="${userImg}" style="width: 65px; height: 65px; border-radius: 50%; object-fit: cover; border: 2px solid #7928ca; padding: 2px;">
                    ${user.status === 'online' ? '<span class="status-dot" style="position: absolute; bottom: 5px; right: 5px; width: 14px; height: 14px; background-color: #1ed760; border: 3px solid #0b0b0e; border-radius: 50%; box-shadow: 0 0 5px #1ed760;"></span>' : ''}
                </div>
                <span style="display: block; font-size: 11px; margin-top: 5px; color: #888;">${user.displayName || 'İstifadəçi'}</span>
            `;
            activeList.appendChild(userDiv);
        });
    });
}

// 2. AŞAĞI BÖLMƏ: Yazışma Keçmişi (Inbox)
function loadChatHistory(myUid) {
    const chatContainer = document.getElementById('chat-list-container');
    if (!chatContainer) return;

    // "participants" massivində mənim UID olan bütün mesajları çəkirik
    const q = query(
        collection(db, "direct_messages"),
        where("participants", "array-contains", myUid)
    );

    onSnapshot(q, (snapshot) => {
        chatContainer.innerHTML = '';
        const chatteredUsers = new Set(); 
        let messages = [];

        snapshot.forEach(doc => messages.push(doc.data()));

        // Mesajları vaxta görə sıralayırıq (İndeks xətası olmasın deyə kod daxilində)
        messages.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (messages.length === 0) {
            chatContainer.innerHTML = '<p style="text-align:center; color:#555; margin-top:30px; font-size:13px;">Hələ ki, yazışma yoxdur.</p>';
            return;
        }

        messages.forEach((msgData) => {
            // Qarşı tərəfin UID-sini tapırıq
            const otherUid = msgData.senderId === myUid ? msgData.receiverId : msgData.senderId;

            // Hər istifadəçi siyahıda yalnız bir dəfə (ən son mesajı ilə) görünsün
            if (!chatteredUsers.has(otherUid)) {
                chatteredUsers.add(otherUid);
                renderChatItem(otherUid, msgData.text, chatContainer);
            }
        });
    });
}

// 3. KÖMƏKÇİ FUNKSİYA: Inbox elementlərini render edir
async function renderChatItem(uid, lastMsg, container) {
    onSnapshot(doc(db, "users", uid), (userDoc) => {
        const userData = userDoc.data();
        if (!userData) return;

        // Əgər element artıq varsa, köhnəsini silirik (məlumat yenilənəndə təkrar olmasın)
        let existingItem = document.getElementById(`chat-item-${uid}`);
        if (existingItem) existingItem.remove();

        const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}`;
        
        const chatItem = document.createElement('a');
        chatItem.id = `chat-item-${uid}`;
        chatItem.className = 'chat-item';
        chatItem.href = `chat.html?uid=${uid}`;
        chatItem.style.display = 'flex';
        chatItem.style.alignItems = 'center';
        chatItem.style.gap = '15px';
        chatItem.style.textDecoration = 'none';
        chatItem.style.marginBottom = '20px';

        chatItem.innerHTML = `
            <img src="${userImg}" class="chat-img" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover;">
            <div class="chat-info">
                <h4 style="margin: 0; font-size: 15px; color: white;">${userData.displayName || 'İstifadəçi'}</h4>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">${lastMsg.substring(0, 35)}${lastMsg.length > 35 ? '...' : ''}</p>
            </div>
        `;
        container.appendChild(chatItem);
    });
}

// 4. AUTH MÜŞAHİDƏÇİSİ: Giriş edən kimi hər şeyi başladır
onAuthStateChanged(auth, (user) => {
    if (user) {
        // İstifadəçini onlayn statusuna gətiririk
        updateDoc(doc(db, "users", user.uid), { status: "online" });
        
        // Funksiyaları çağırırıq
        loadActiveUsers(user.uid);
        loadChatHistory(user.uid);
    } else {
        // Giriş edilməyibsə login səhifəsinə göndər
        window.location.href = 'login.html';
    }
});
