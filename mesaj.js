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

// 1. AKTİV İSTİFADƏÇİLƏRİ (YAŞIL NÖQTƏ) GƏTİRƏN FUNKSİYA
function loadActiveUsers() {
    const activeList = document.getElementById('active-users-list');
    if (!activeList) return;

    // Firebase-dən statusu "online" olanları real-zamanlı izlə
    const q = query(collection(db, "users"), where("status", "==", "online"));

    onSnapshot(q, (snapshot) => {
        activeList.innerHTML = '';
        snapshot.forEach((userDoc) => {
            const userData = userDoc.data();
            
            // Özümüzü siyahıda göstərmirik
            if (userData.uid !== auth.currentUser?.uid) {
                const userCard = document.createElement('div');
                userCard.className = 'active-user-card';
                
                // Klikləyəndə söhbətə yönləndir
                userCard.onclick = () => {
                    window.location.href = `chat.html?uid=${userData.uid}`;
                };

                const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}&background=333&color=fff`;
                
                userCard.innerHTML = `
                    <div style="position: relative;">
                        <img src="${userImg}" alt="Avatar">
                        <div class="online-indicator"></div>
                    </div>
                    <span>${userData.displayName || 'İstifadəçi'}</span>
                `;
                activeList.appendChild(userCard);
            }
        });
    });
}

// 2. ÜMUMİ ÇAT SİYAHISINI YÜKLƏ (KÖHNƏ MESAJLARIN OLDUĞU ADAMLA)
function loadChatHistory() {
    const chatContainer = document.getElementById('chats-list-container');
    if (!chatContainer) return;

    // Burada hələlik bütün istifadəçiləri göstəririk (siyahı kimi)
    onSnapshot(collection(db, "users"), (snapshot) => {
        chatContainer.innerHTML = '';
        snapshot.forEach((userDoc) => {
            const userData = userDoc.data();
            if (userData.uid !== auth.currentUser?.uid) {
                const chatItem = document.createElement('a');
                chatItem.className = 'chat-item';
                chatItem.href = `chat.html?uid=${userData.uid}`;
                
                const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}&background=333&color=fff`;

                chatItem.innerHTML = `
                    <img src="${userImg}" class="chat-avatar">
                    <div class="chat-info">
                        <h4>${userData.displayName || 'İstifadəçi'}</h4>
                        <p>${userData.status === 'online' ? 'Hazırda aktivdir' : 'Oflayn'}</p>
                    </div>
                `;
                chatContainer.appendChild(chatItem);
            }
        });
    });
}

// 3. GİRİŞ YOXLANIŞI
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Sayta girəndə statusu online et
        await updateDoc(doc(db, "users", user.uid), { status: "online" });
        
        loadActiveUsers();
        loadChatHistory();
    } else {
        window.location.href = "login.html";
    }
});
