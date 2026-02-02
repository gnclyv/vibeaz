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
async function handleLike(postId) {
    const postRef = doc(db, "posts", postId);
    try {
        await updateDoc(postRef, {
            likes: increment(1) // Like sayını 1 vahid artırır
        });
    } catch (error) {
        console.error("Like xətası:", error);
    }
}

// 2. Fayl Yükləmə (Post paylaşanda like: 0 olaraq başlayır)
async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = ""; 
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        alert("Yüklənir...");
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            const imageUrl = result.data.url;

            let userText = "";
            if (type === 'posts') {
                userText = prompt("Başlıq yazın:") || "";
            }

            await firebaseAddDoc(firebaseCollection(db, type), {
                url: imageUrl,
                text: userText,
                author: "İstifadəçi",
                likes: 0, // Yeni postda like 0 olur
                timestamp: firebaseServerTimestamp()
            });

            alert("Paylaşıldı!");
        } catch (error) {
            alert("Xəta baş verdi.");
        }
    };
}

// 3. Postları Göstərmək (Like düyməsi ilə)
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    
    snapshot.forEach(postDoc => {
        const data = postDoc.data();
        const postId = postDoc.id;
        const likeCount = data.likes || 0;

        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-bottom:1px solid #dbdbdb;">
                <div style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                   <div style="width:32px; height:32px; background:#efefef; border-radius:50%;"></div>
                   <span style="font-weight:600;">İstifadəçi</span>
                </div>
                
                <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${postId}')">
                
                <div style="padding:12px 15px;">
                    <div style="display:flex; gap:15px; font-size:22px; margin-bottom:5px;">
                        <i class="fa-regular fa-heart" style="cursor:pointer;" onclick="handleLike('${postId}')"></i>
                        <i class="fa-regular fa-comment"></i>
                    </div>
                    <p style="margin:0 0 5px 0; font-weight:bold; font-size:14px;">${likeCount} bəyənmə</p>
                    <p style="margin:0; font-size:14px;">
                        <strong>İstifadəçi</strong> ${data.text || ""}
                    </p>
                </div>
            </div>`;
    });
});

// Digər düymələri və story-ni bura əlavə etməyi unutma (əvvəlki koddakı kimi)
document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
window.handleLike = handleLike; // Funksiyanı HTML daxilində işlətmək üçün window-a bağlayırıq
