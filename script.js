const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        alert("Şəkil emal olunur, bir neçə saniyə gözləyin...");

        const formData = new FormData();
        formData.append("image", file);

        try {
            // 1. ImgBB-yə yükləyirik
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            const imageUrl = result.data.url;

            let userText = "";
            
            // 2. MƏNTİQ BURADADIR: Yalnız postdursa başlıq istəyirik
            if (type === 'posts') {
                userText = prompt("Post üçün başlıq yazın:");
            }

            // 3. Firebase-ə göndəririk
            await window.addDoc(window.collection(window.db, type), {
                url: imageUrl,
                text: userText || "", // Story-də boş qalacaq, postda isə ya yazı ya boşluq
                timestamp: window.serverTimestamp()
            });

            alert("Uğurla paylaşıldı! 🚀");
        } catch (error) {
            console.error("Xəta:", error);
            alert("Xəta baş verdi, yenidən yoxlayın.");
        }
    };
}

// Düymələri funksiyaya bağlayırıq
document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// STORY-LƏRİ GÖSTƏR (Yazısız, sadə dairəvi)
window.onSnapshot(window.query(window.collection(window.db, "stories"), window.orderBy("timestamp", "desc")), (snapshot) => {
    const storyContainer = document.getElementById('stories');
    storyContainer.innerHTML = `
        <div class="story-card add-btn" id="shareBtn">
            <div class="story-circle"><i class="fa fa-plus"></i></div>
            <span>Paylaş</span>
        </div>`;
    snapshot.forEach(doc => {
        const data = doc.data();
        storyContainer.innerHTML += `
            <div class="story-card">
                <div class="story-circle active">
                    <img src="${data.url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                </div>
                <span>İstifadəçi</span>
            </div>`;
    });
    // Düyməni yenidən aktiv edirik
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// POSTLARI GÖSTƏR (Yazı ilə birlikdə)
window.onSnapshot(window.query(window.collection(window.db, "posts"), window.orderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; overflow:hidden; border: 1px solid #dbdbdb;">
                <img src="${data.url}" style="width:100%;">
                <div style="padding:10px;">
                    <p style="font-weight:bold; margin-bottom:5px;">İstifadəçi</p>
                    <p>${data.text || ""}</p>
                </div>
            </div>`;
    });
});
