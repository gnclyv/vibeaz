import { updateDoc, doc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const db = window.db;
const firebaseCollection = window.firebaseCollection || window.collection;
const firebaseAddDoc = window.firebaseAddDoc || window.addDoc;
const firebaseOnSnapshot = window.firebaseOnSnapshot || window.onSnapshot;
const firebaseQuery = window.firebaseQuery || window.query;
const firebaseOrderBy = window.firebaseOrderBy || window.orderBy;
const firebaseServerTimestamp = window.firebaseServerTimestamp || window.serverTimestamp;

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// LIKE FUNKSİYASI
async function handleLike(postId) {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    if (likedPosts.includes(postId)) return;

    try {
        await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
        likedPosts.push(postId);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (e) { console.error(e); }
}

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
    fileInput.click();
    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append("image", file);
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const result = await res.json();
        const url = result.data.url;

        let text = type === 'posts' ? prompt("Başlıq yazın:") : "";
        
        await firebaseAddDoc(firebaseCollection(db, type), {
            url, text, likes: 0, comments: [], timestamp: firebaseServerTimestamp()
        });
    };
}

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

    snap.forEach(postDoc => {
        const data = postDoc.data();
        const id = postDoc.id;
        const isLiked = likedPosts.includes(id);
        const comments = data.comments || [];

        let commentsHTML = comments.map(c => `<p style="margin:2px 0; font-size:13px;"><strong>${c.author}</strong> ${c.text}</p>`).join('');

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
                </div>
            </div>`;
    });
});

document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
window.handleLike = handleLike;
window.handleComment = handleComment;
