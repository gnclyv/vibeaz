import { updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const db = window.db;
const firebaseCollection = window.firebaseCollection || window.collection;
const firebaseAddDoc = window.firebaseAddDoc || window.addDoc;
const firebaseOnSnapshot = window.firebaseOnSnapshot || window.onSnapshot;
const firebaseQuery = window.firebaseQuery || window.query;
const firebaseOrderBy = window.firebaseOrderBy || window.orderBy;
const firebaseServerTimestamp = window.firebaseServerTimestamp || window.serverTimestamp;
// Like üçün lazım olan əlavə Firebase funksiyaları (əgər index.html-də yoxdursa bura diqqət)
import { updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 1. Like Funksiyası
// 1. Like Funksiyası (Limitli)
async function handleLike(postId) {
    // Brauzer yaddaşını yoxlayırıq
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

    if (likedPosts.includes(postId)) {
        alert("Siz artıq bu postu bəyənmisiniz! ❤️");
        return;
    }

const postRef = doc(db, "posts", postId);
try {
await updateDoc(postRef, {
            likes: increment(1) // Like sayını 1 vahid artırır
            likes: increment(1)
});
        
        // Yaddaşa əlavə edirik ki, bir daha like ata bilməsin
        likedPosts.push(postId);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        
        // Səhifəni yeniləmədən ikonun rəngini dəyişmək üçün (Snapshot onsuz da işləyir)
} catch (error) {
console.error("Like xətası:", error);
}
}

// 2. Fayl Yükləmə (Post paylaşanda like: 0 olaraq başlayır)
// 2. Fayl Yükləmə
async function handleFileUpload(type) {
const fileInput = document.getElementById('fileInput');
fileInput.value = ""; 
@@ -32,7 +46,7 @@ async function handleFileUpload(type) {
const file = fileInput.files[0];
if (!file) return;

        alert("Yüklənir...");
        alert("Paylaşılır...");
const formData = new FormData();
formData.append("image", file);

@@ -46,58 +60,57 @@ async function handleFileUpload(type) {

let userText = "";
if (type === 'posts') {
                userText = prompt("Başlıq yazın:") || "";
                userText = prompt("Başlıq:") || "";
}

await firebaseAddDoc(firebaseCollection(db, type), {
url: imageUrl,
text: userText,
author: "İstifadəçi",
                likes: 0, // Yeni postda like 0 olur
                likes: 0,
timestamp: firebaseServerTimestamp()
});

            alert("Paylaşıldı!");
            alert("Uğurla paylaşıldı!");
} catch (error) {
            alert("Xəta baş verdi.");
            alert("Xəta!");
}
};
}

// 3. Postları Göstərmək (Like düyməsi ilə)
// 3. Postları Göstərmək
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
const postList = document.getElementById('post-list');
postList.innerHTML = '';

    // Yaddaşdakı bəyənilmiş postları alırıq
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

snapshot.forEach(postDoc => {
const data = postDoc.data();
const postId = postDoc.id;
        const likeCount = data.likes || 0;
        const isLiked = likedPosts.includes(postId);

postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-bottom:1px solid #dbdbdb;">
                <div style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                   <div style="width:32px; height:32px; background:#efefef; border-radius:50%;"></div>
                   <span style="font-weight:600;">İstifadəçi</span>
                </div>
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; border:1px solid #dbdbdb; overflow:hidden;">
                <div style="padding: 10px; font-weight:bold;">İstifadəçi</div>
               
               <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${postId}')">
               
                <div style="padding:12px 15px;">
                    <div style="display:flex; gap:15px; font-size:22px; margin-bottom:5px;">
                        <i class="fa-regular fa-heart" style="cursor:pointer;" onclick="handleLike('${postId}')"></i>
                <div style="padding:12px;">
                    <div style="display:flex; gap:15px; font-size:24px; margin-bottom:5px;">
                        <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                           style="cursor:pointer; color: ${isLiked ? '#ed4956' : 'black'};" 
                           onclick="handleLike('${postId}')"></i>
                       <i class="fa-regular fa-comment"></i>
                   </div>
                    <p style="margin:0 0 5px 0; font-weight:bold; font-size:14px;">${likeCount} bəyənmə</p>
                    <p style="margin:0; font-size:14px;">
                        <strong>İstifadəçi</strong> ${data.text || ""}
                    </p>
                    <p style="margin:0 0 5px 0; font-weight:bold;">${data.likes || 0} bəyənmə</p>
                    <p style="margin:0;"><strong>İstifadəçi</strong> ${data.text || ""}</p>
               </div>
           </div>`;
});
});

// Digər düymələri və story-ni bura əlavə etməyi unutma (əvvəlki koddakı kimi)
document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
window.handleLike = handleLike; // Funksiyanı HTML daxilində işlətmək üçün window-a bağlayırıq
window.handleLike = handleLike;
