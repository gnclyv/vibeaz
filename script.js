import { updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const db = window.db;
const firebaseCollection = window.firebaseCollection || window.collection;
const firebaseAddDoc = window.firebaseAddDoc || window.addDoc;
const firebaseOnSnapshot = window.firebaseOnSnapshot || window.onSnapshot;
const firebaseQuery = window.firebaseQuery || window.query;
const firebaseOrderBy = window.firebaseOrderBy || window.orderBy;
const firebaseServerTimestamp = window.firebaseServerTimestamp || window.serverTimestamp;

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

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

// 2. Fayl Yükləmə
async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = ""; 
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        alert("Paylaşılır...");
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
    };
}

// 3. Postları Göstərmək
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    
    // Yaddaşdakı bəyənilmiş postları alırıq
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

    snapshot.forEach(postDoc => {
        const data = postDoc.data();
        const postId = postDoc.id;
        const isLiked = likedPosts.includes(postId);

        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; border:1px solid #dbdbdb; overflow:hidden;">
                <div style="padding: 10px; font-weight:bold;">İstifadəçi</div>
                
                <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${postId}')">
                
                <div style="padding:12px;">
                    <div style="display:flex; gap:15px; font-size:24px; margin-bottom:5px;">
                        <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                           style="cursor:pointer; color: ${isLiked ? '#ed4956' : 'black'};" 
                           onclick="handleLike('${postId}')"></i>
                        <i class="fa-regular fa-comment"></i>
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
