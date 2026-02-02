// Sənin ImgBB API açarın
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.click(); // Qalereyanı açır

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        // Yüklənmə prosesini göstərək
        alert("Şəkil yüklənir, zəhmət olmasa bir neçə saniyə gözləyin...");

        // 1. Şəkli ImgBB-yə göndərib link alırıq
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            
            if (!result.success) throw new Error("Yükləmə alınmadı");
            
            const imageUrl = result.data.url;

            // 2. Postdursa yazı soruşuruq, Story-dirsə birbaşa keçirik
            let userText = "";
            if (type === 'posts') {
                userText = prompt("Post üçün başlığı yazın:");
            }

            // 3. Firebase-ə yazırıq
            await window.addDoc(window.collection(window.db, type), {
                url: imageUrl,
                text: userText || (type === 'posts' ? "Yeni Vibe ⚡" : ""),
                timestamp: window.serverTimestamp()
            });

            alert("Uğurla paylaşıldı! 🚀");
        } catch (error) {
            console.error("Xəta:", error);
            alert("Şəkil yüklənərkən xəta baş verdi. İnterneti və ya API açarını yoxlayın.");
        }
    };
}

// Düymələri bağlayırıq
document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// --- POST VƏ STORY-LƏRİ GÖSTƏRMƏK (Əvvəlki kodların davamı) ---
// Story-ləri çək
window.onSnapshot(window.query(window.collection(window.db, "stories"), window.orderBy("timestamp", "desc")), (snapshot) => {
    const storyContainer = document.getElementById('stories');
    storyContainer.innerHTML = `<div class="story-card add-btn" id="shareBtn" onclick="location.reload()"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>`;
    snapshot.forEach(doc => {
        const data = doc.data();
        storyContainer.innerHTML += `<div class="story-card"><div class="story-circle active"><img src="${data.url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></div><span>User</span></div>`;
    });
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// Postları çək
window.onSnapshot(window.query(window.collection(window.db, "posts"), window.orderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `<div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; overflow:hidden;"><img src="${data.url}" style="width:100%;"><p style="padding:10px;">${data.text}</p></div>`;
    });
});
