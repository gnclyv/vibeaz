// 1. Firebase funksiyalarını window-dan götürürük (index.html-dəki window təyinatlarına uyğun)
const db = window.db;
const firebaseCollection = window.firebaseCollection || window.collection;
const firebaseAddDoc = window.firebaseAddDoc || window.addDoc;
const firebaseOnSnapshot = window.firebaseOnSnapshot || window.onSnapshot;
const firebaseQuery = window.firebaseQuery || window.query;
const firebaseOrderBy = window.firebaseOrderBy || window.orderBy;
const firebaseServerTimestamp = window.firebaseServerTimestamp || window.serverTimestamp;

// 2. ImgBB API
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 3. Əsas Yükləmə Funksiyası
async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = ""; 
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        alert("Zəhmət olmasa gözləyin, yüklənir...");

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
                userText = prompt("Post üçün başlıq yazın:") || "";
            }

            // Firebase-ə göndərmə (Xətasız variant)
            await firebaseAddDoc(firebaseCollection(db, type), {
                url: imageUrl,
                text: userText,
                author: "İstifadəçi",
                timestamp: firebaseServerTimestamp()
            });

            alert("Uğurla paylaşıldı! ✨");
        } catch (error) {
            console.error("Xəta:", error);
            alert("Xəta baş verdi, yenidən yoxlayın.");
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
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-bottom:1px solid #dbdbdb;">
                <div style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                   <div style="width:32px; height:32px; background:#efefef; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                      <i class="fa fa-user" style="color:#ccc; font-size:14px;"></i>
                   </div>
                   <span style="font-weight:600;">İstifadəçi</span>
                </div>
                
                <img src="${data.url}" style="width:100%; display:block;">
                
                <div style="padding:12px 15px;">
                    <div style="display:flex; gap:15px; font-size:22px; margin-bottom:8px;">
                        <i class="fa-regular fa-heart" style="cursor:pointer;"></i>
                        <i class="fa-regular fa-comment" style="cursor:pointer;"></i>
                        </div>
                    <p style="margin:0; font-size:14px;">
                        <strong>İstifadəçi</strong> ${data.text || ""}
                    </p>
                </div>
            </div>`;
    });
});
