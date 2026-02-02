import { updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { updateDoc, doc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const db = window.db;
const firebaseCollection = window.firebaseCollection || window.collection;
@@ -10,107 +10,107 @@ const firebaseServerTimestamp = window.firebaseServerTimestamp || window.serverT

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 1. Like Funksiyası (Limitli)
// LIKE FUNKSİYASI
async function handleLike(postId) {
    // Brauzer yaddaşını yoxlayırıq
let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    if (likedPosts.includes(postId)) return;

    if (likedPosts.includes(postId)) {
        alert("Siz artıq bu postu bəyənmisiniz! ❤️");
        return;
    }

    const postRef = doc(db, "posts", postId);
try {
        await updateDoc(postRef, {
            likes: increment(1)
        });
        
        // Yaddaşa əlavə edirik ki, bir daha like ata bilməsin
        await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
likedPosts.push(postId);
localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        
        // Səhifəni yeniləmədən ikonun rəngini dəyişmək üçün (Snapshot onsuz da işləyir)
    } catch (error) {
        console.error("Like xətası:", error);
    }
    } catch (e) { console.error(e); }
}

// 2. Fayl Yükləmə
// ŞƏRH FUNKSİYASI
async function handleComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({ text, author: "İstifadəçi", time: Date.now() })
        });
        input.value = "";
    } catch (e) { console.error(e); }
}

// YÜKLƏMƏ FUNKSİYASI
async function handleFileUpload(type) {
const fileInput = document.getElementById('fileInput');
    fileInput.value = ""; 
    fileInput.click(); 

    fileInput.click();
fileInput.onchange = async () => {
const file = fileInput.files[0];
if (!file) return;

        alert("Paylaşılır...");
        
const formData = new FormData();
formData.append("image", file);
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const result = await res.json();
        const url = result.data.url;

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            const imageUrl = result.data.url;

            let userText = "";
            if (type === 'posts') {
                userText = prompt("Başlıq:") || "";
            }

            await firebaseAddDoc(firebaseCollection(db, type), {
                url: imageUrl,
                text: userText,
                author: "İstifadəçi",
                likes: 0,
                timestamp: firebaseServerTimestamp()
            });

            alert("Uğurla paylaşıldı!");
        } catch (error) {
            alert("Xəta!");
        }
        let text = type === 'posts' ? prompt("Başlıq yazın:") : "";
        
        await firebaseAddDoc(firebaseCollection(db, type), {
            url, text, likes: 0, comments: [], timestamp: firebaseServerTimestamp()
        });
};
}

// 3. Postları Göstərmək
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    
    // Yaddaşdakı bəyənilmiş postları alırıq
// STORY DİNAMİKASI
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "stories"), firebaseOrderBy("timestamp", "desc")), (snap) => {
    const container = document.getElementById('stories');
    container.innerHTML = `<div class="story-card" id="addStory"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>`;
    snap.forEach(doc => {
        const data = doc.data();
        container.innerHTML += `<div class="story-card"><div class="story-circle"><img src="${data.url}"></div><span>İstifadəçi</span></div>`;
    });
    document.getElementById('addStory').onclick = () => handleFileUpload('stories');
});

// POSTLARIN GÖSTƏRİLMƏSİ
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snap) => {
    const list = document.getElementById('post-list');
    list.innerHTML = '';
const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

    snapshot.forEach(postDoc => {
    snap.forEach(postDoc => {
const data = postDoc.data();
        const postId = postDoc.id;
        const isLiked = likedPosts.includes(postId);
        const id = postDoc.id;
        const isLiked = likedPosts.includes(id);
        const comments = data.comments || [];

        let commentsHTML = comments.map(c => `<p style="margin:2px 0; font-size:13px;"><strong>${c.author}</strong> ${c.text}</p>`).join('');

        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; border:1px solid #dbdbdb; overflow:hidden;">
                <div style="padding: 10px; font-weight:bold;">İstifadəçi</div>
                
                <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${postId}')">
                
                <div style="padding:12px;">
                    <div style="display:flex; gap:15px; font-size:24px; margin-bottom:5px;">
        list.innerHTML += `
            <div class="post-card">
                <div class="post-header">
                    <div style="width:30px; height:30px; border-radius:50%; background:#eee;"></div>
                    <span>İstifadəçi</span>
                </div>
                <div class="post-img-container">
                    <img src="${data.url}" ondblclick="handleLike('${id}')">
                </div>
                <div class="post-info">
                    <div class="post-actions">
                       <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                           style="cursor:pointer; color: ${isLiked ? '#ed4956' : 'black'};" 
                           onclick="handleLike('${postId}')"></i>
                        <i class="fa-regular fa-comment"></i>
                           style="color:${isLiked ? '#ed4956' : 'black'}; cursor:pointer;" onclick="handleLike('${id}')"></i>
                        <i class="fa-regular fa-comment" onclick="document.getElementById('comment-input-${id}').focus()"></i>
                    </div>
                    <strong>${data.likes || 0} bəyənmə</strong>
                    <p style="margin:5px 0;"><strong>İstifadəçi</strong> ${data.text || ""}</p>
                    <div id="comments-${id}">${commentsHTML}</div>
                    <div class="comment-input-area">
                        <input type="text" id="comment-input-${id}" placeholder="Şərh yaz...">
                        <button onclick="handleComment('${id}')" style="background:none; border:none; color:#0095f6; font-weight:bold; cursor:pointer;">Paylaş</button>
                   </div>
                    <p style="margin:0 0 5px 0; font-weight:bold;">${data.likes || 0} bəyənmə</p>
                    <p style="margin:0;"><strong>İstifadəçi</strong> ${data.text || ""}</p>
               </div>
           </div>`;
});
});

document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
window.handleLike = handleLike;
window.handleComment = handleComment;
