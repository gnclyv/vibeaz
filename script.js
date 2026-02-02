// Firebase funksiyalarını window-dan götürürük
const db = window.db;
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        alert("Şəkil yüklənir...");

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
                userText = prompt("Post üçün başlıq yazın:");
            }

            // Məlumatı Firebase-ə yazırıq
            await window.firebaseAddDoc(window.firebaseCollection(db, type), {
                url: imageUrl,
                text: userText || "",
                timestamp: window.firebaseServerTimestamp()
            });

            alert("Paylaşıldı!");
        } catch (error) {
            console.error(error);
            alert("Xəta baş verdi! Konsola baxın.");
        }
    };
}

document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// Stories
window.firebaseOnSnapshot(window.firebaseQuery(window.firebaseCollection(db, "stories"), window.firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const storyContainer = document.getElementById('stories');
    storyContainer.innerHTML = '<div class="story-card add-btn" id="shareBtn"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>';
    snapshot.forEach(doc => {
        const data = doc.data();
        storyContainer.innerHTML += `
            <div class="story-card">
                <div class="story-circle active"><img src="${data.url}" style="width:100%;height:100%;object-fit:cover;"></div>
                <span>İstifadəçi</span>
            </div>`;
    });
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// Posts
window.firebaseOnSnapshot(window.firebaseQuery(window.firebaseCollection(db, "posts"), window.firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom: 20px; background: white; border-bottom: 1px solid #dbdbdb;">
                <div class="post-header" style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #eee;"></div>
                    <span style="font-weight: bold;">İstifadəçi</span>
                </div>
                <img src="${data.url}" style="width: 100%;">
                <div class="post-actions" style="padding: 10px; display: flex; gap: 15px; font-size: 20px;">
                    <i class="fa-regular fa-heart"></i>
                    <i class="fa-regular fa-comment"></i>
                    <i class="fa-regular fa-paper-plane"></i>
                </div>
                <div style="padding: 0 10px 10px;">
                    <strong>İstifadəçi</strong> ${data.text || ""}
                </div>
            </div>`;
    });
});
