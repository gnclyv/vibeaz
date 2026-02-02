// 1. Firebase funksiyalarını window-dan götürürük (index.html-dəki window təyinatlarına uyğun)
const db = window.db;
const firebaseCollection = window.firebaseCollection || window.collection;
const firebaseAddDoc = window.firebaseAddDoc || window.addDoc;
const firebaseOnSnapshot = window.firebaseOnSnapshot || window.onSnapshot;
const firebaseQuery = window.firebaseQuery || window.query;
const firebaseOrderBy = window.firebaseOrderBy || window.orderBy;
const firebaseServerTimestamp = window.firebaseServerTimestamp || window.serverTimestamp;
// Like üçün lazım olan əlavə Firebase funksiyaları (əgər index.html-də yoxdursa bura diqqət)
import { updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 2. ImgBB API
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 3. Əsas Yükləmə Funksiyası
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
@@ -20,8 +32,7 @@ async function handleFileUpload(type) {
const file = fileInput.files[0];
if (!file) return;

        alert("Zəhmət olmasa gözləyin, yüklənir...");

        alert("Yüklənir...");
const formData = new FormData();
formData.append("image", file);

@@ -35,79 +46,58 @@ async function handleFileUpload(type) {

let userText = "";
if (type === 'posts') {
                userText = prompt("Post üçün başlıq yazın:") || "";
                userText = prompt("Başlıq yazın:") || "";
}

            // Firebase-ə göndərmə (Xətasız variant)
await firebaseAddDoc(firebaseCollection(db, type), {
url: imageUrl,
text: userText,
author: "İstifadəçi",
                likes: 0, // Yeni postda like 0 olur
timestamp: firebaseServerTimestamp()
});

            alert("Uğurla paylaşıldı! ✨");
            alert("Paylaşıldı!");
} catch (error) {
            console.error("Xəta:", error);
            alert("Xəta baş verdi, yenidən yoxlayın.");
            alert("Xəta baş verdi.");
}
};
}

// 4. Düymələrin aktiv edilməsi
document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// 5. STORY BÖLMƏSİ (Yeni Dizayn)
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "stories"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const storyContainer = document.getElementById('stories');
    storyContainer.innerHTML = `
        <div class="story-card add-btn" id="shareBtn">
            <div class="story-circle"><i class="fa fa-plus"></i></div>
            <span>Sənin hekayən</span>
        </div>`;
    
    snapshot.forEach(doc => {
        const data = doc.data();
        storyContainer.innerHTML += `
            <div class="story-card">
                <div class="story-circle">
                    <img src="${data.url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:2px solid white;">
                </div>
                <span>İstifadəçi</span>
            </div>`;
    });
    // Yenidən yaranan düyməni klikə bağlayırıq
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// 6. POST FEED (Təyyarə loqosu silinmiş və təmizlənmiş)
// 3. Postları Göstərmək (Like düyməsi ilə)
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
const postList = document.getElementById('post-list');
postList.innerHTML = '';

    snapshot.forEach(doc => {
        const data = doc.data();
    snapshot.forEach(postDoc => {
        const data = postDoc.data();
        const postId = postDoc.id;
        const likeCount = data.likes || 0;

postList.innerHTML += `
           <div class="post-card" style="margin-bottom:20px; background:white; border-bottom:1px solid #dbdbdb;">
               <div style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                   <div style="width:32px; height:32px; background:#efefef; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                      <i class="fa fa-user" style="color:#ccc; font-size:14px;"></i>
                   </div>
                   <div style="width:32px; height:32px; background:#efefef; border-radius:50%;"></div>
                  <span style="font-weight:600;">İstifadəçi</span>
               </div>
               
                <img src="${data.url}" style="width:100%; display:block;">
                <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${postId}')">
               
               <div style="padding:12px 15px;">
                    <div style="display:flex; gap:15px; font-size:22px; margin-bottom:8px;">
                        <i class="fa-regular fa-heart" style="cursor:pointer;"></i>
                        <i class="fa-regular fa-comment" style="cursor:pointer;"></i>
                        </div>
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
