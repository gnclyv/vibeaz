import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. Firebase Konfiqurasiyası
const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};
const auth = getAuth();
const db = getFirestore();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 2. İstifadəçi statusunu izləmə
onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    if (user) {
        // 1. Ad və Email-i hər kəsə özəl yazdırırıq
        const userName = user.email.split('@')[0];
        document.getElementById('header-username').innerText = userName;
        document.getElementById('profile-display-name').innerText = userName;
        document.getElementById('profile-email').innerText = user.email;

        // 2. Real zamanda postları və sayını gətiririk
        loadMyData(userName);
} else {
        document.getElementById('app').style.display = 'block';
        loadPosts();
        window.location.href = "login.html";
}
});

// 3. Post Paylaşma (Gmail-ə uyğun və Xətasız)
async function uploadPost() {
    const fileInp = document.getElementById('fileInput');
function loadMyData(userName) {
    const grid = document.getElementById('user-posts-grid');
    const postCountElement = document.getElementById('post-count');

    fileInp.onchange = async () => {
        const user = auth.currentUser;
        if (!user || !fileInp.files[0]) return;

        const fd = new FormData();
        fd.append("image", fileInp.files[0]);

        try {
            // Şəkli ImgBB-yə yükləyirik
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();

            if (result.success) {
                const text = prompt("Post üçün açıqlama:");
                
                // split xətasının qarşısını alan təhlükəsiz ad məntiqi
                let finalName = "İstifadəçi";
                if (user.displayName) {
                    finalName = user.displayName;
                } else if (user.email) {
                    // Gmail ünvanını @-dan parçalayıb ad kimi istifadə edirik
                    finalName = user.email.split('@')[0];
                }

                // Sildiyin 'posts' kolleksiyası burada avtomatik yaranacaq
                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    userName: finalName,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
                alert("Paylaşıldı!");
            }
        } catch (e) {
            console.error("Yükləmə xətası:", e);
            alert("Xəta baş verdi: " + e.message);
        }
    };
    fileInp.click();
}

// 4. Like Funksiyası
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;

    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
    } catch (e) { console.error("Like xətası:", e); }
};

// 5. Şərh Yazmaq Funksiyası
window.addComment = async (postId) => {
    const user = auth.currentUser;
    const input = document.getElementById(`comment-input-${postId}`);
    const commentText = input.value.trim();
    // Yalnız bu istifadəçinin postlarını axtarırıq
    const q = query(collection(db, "posts"), where("userName", "==", userName));

    if (!commentText || !user) return;

    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({
                user: user.email.split('@')[0], // Şərhlərdə də email-dən ad götürürük
                text: commentText,
                time: Date.now()
            })
        });
        input.value = ""; 
    } catch (e) { console.error("Şərh xətası:", e); }
};

// 6. Postları Yükləmə (Modern Dizaynla)
function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(collection(db, "posts"), (snap) => {
        let postsArray = [];
        snap.forEach(d => postsArray.push({ id: d.id, ...d.data() }));
    onSnapshot(q, (snapshot) => {
        grid.innerHTML = "";
        let count = 0;

        // Yenidən köhnəyə sıralama
        postsArray.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        list.innerHTML = ''; 
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];

        postsArray.forEach(data => {
            const id = data.id;
            const isLiked = likedPosts.includes(id);
            const author = data.userName || "Anonim";
            const comments = data.comments || [];

            list.innerHTML += `
                <div class="post-card" style="background:#111; margin-bottom:20px; border-radius:15px; overflow:hidden; border:1px solid #333;">
                    <div style="padding:10px; display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${author}&background=random" style="width:30px; border-radius:50%;">
                        <span style="font-weight:bold; color:white;">${author}</span>
                    </div>
                    <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${id}')">
                    <div style="padding:12px;">
                        <div style="display:flex; gap:15px; margin-bottom:10px; font-size:20px; color:white;">
                            <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                               onclick="handleLike('${id}')" style="cursor:pointer; color:${isLiked ? '#ff3040' : 'white'}"></i>
                        </div>
                        <div style="color:white; font-size:14px; margin-bottom:5px;"><b>${data.likes || 0} bəyənmə</b></div>
                        <div style="color:white; font-size:14px;"><b>${author}</b> ${data.text || ""}</div>
                        
                        <div id="comments-${id}" style="font-size:13px; color:#888; margin-top:10px;">
                            ${comments.slice(-2).map(c => `<div><b>${c.user}</b> ${c.text}</div>`).join('')}
                        </div>

                        <div style="display:flex; margin-top:10px; border-top:1px solid #222; padding-top:8px;">
                            <input type="text" id="comment-input-${id}" placeholder="Şərh yaz..." 
                                   style="background:none; border:none; color:white; flex:1; outline:none; font-size:13px;">
                            <button onclick="addComment('${id}')" style="background:none; border:none; color:#0095f6; font-weight:bold; cursor:pointer;">Paylaş</button>
                        </div>
                    </div>
        snapshot.forEach((doc) => {
            count++;
            const data = doc.data();
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${data.url}" alt="Post">
               </div>`;
});
        
        // Post sayını real zamanda yeniləyirik
        postCountElement.innerText = count;
});
}

// Düymələr
document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth);
