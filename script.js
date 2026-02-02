// Paylaşma funksiyası (Növünə görə: 'posts' və ya 'stories')
async function uploadToFirebase(type) {
    const imageUrl = prompt(type === 'stories' ? "Story üçün şəkil linki:" : "Post üçün şəkil linki:");
    
    if (imageUrl && imageUrl.trim() !== "") {
        try {
            await window.addDoc(window.collection(window.db, type), {
                url: imageUrl,
                timestamp: window.serverTimestamp()
            });
            alert("Uğurla paylaşıldı! ✨");
        } catch (error) {
            alert("Xəta: Firestore Rules-u yoxlayın!");
        }
    }
}

// Düymələri fərqli mənbələrə bağlayırıq
document.getElementById('shareBtn').onclick = () => uploadToFirebase('stories');
document.getElementById('mainAddBtn').onclick = () => uploadToFirebase('posts');

// --- 1. Story-ləri Yuxarıda Göstərmək ---
const storyContainer = document.getElementById('stories');
const qStories = window.query(window.collection(window.db, "stories"), window.orderBy("timestamp", "desc"));

window.onSnapshot(qStories, (snapshot) => {
    // Əvvəlcə ancaq "Əlavə et" düyməsini saxlayırıq
    storyContainer.innerHTML = `
        <div class="story-card add-btn" id="shareBtn" onclick="location.reload()">
            <div class="story-circle"><i class="fa fa-plus"></i></div>
            <span>Paylaş</span>
        </div>`;
    
    snapshot.forEach((doc) => {
        const story = doc.data();
        const storyHtml = `
            <div class="story-card">
                <div class="story-circle active">
                    <img src="${story.url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                </div>
                <span>İstifadəçi</span>
            </div>`;
        storyContainer.innerHTML += storyHtml;
    });
});

// --- 2. Postları Aşağıda Göstərmək ---
const postList = document.getElementById('post-list');
const qPosts = window.query(window.collection(window.db, "posts"), window.orderBy("timestamp", "desc"));

window.onSnapshot(qPosts, (snapshot) => {
    postList.innerHTML = '';
    snapshot.forEach((doc) => {
        const post = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom: 20px; border-bottom: 1px solid #eee;">
                <img src="${post.url}" style="width:100%; border-radius:10px;">
                <p style="padding:10px;">Yeni Vibe ⚡</p>
            </div>`;
    });
});
