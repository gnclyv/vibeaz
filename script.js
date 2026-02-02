// 1. Firebase funksiyalarını HTML-dən götürürük
const db = window.db;
const collection = window.collection;
const addDoc = window.addDoc;
const query = window.query;
const orderBy = window.orderBy;
const onSnapshot = window.onSnapshot;
const serverTimestamp = window.serverTimestamp;

// 2. ImgBB API açarın
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 3. Yükləmə Funksiyası
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
            // ImgBB-yə göndəririk
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

            // Firebase-ə yazırıq
            await addDoc(collection(db, type), {
                url: imageUrl,
                text: userText || "",
                timestamp: serverTimestamp()
            });

            alert("Uğurla paylaşıldı! 🚀");
        } catch (error) {
            console.error("Xəta:", error);
            alert("Xəta baş verdi: " + error.message);
        }
    };
}

// 4. Düymələri bağlayırıq
document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// 5. Story-ləri göstər
onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snapshot) => {
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
                    <img src="${data.url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
                </div>
                <span>User</span>
            </div>`;
    });
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// 6. Postları göstər
onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; overflow:hidden; border:1px solid #dbdbdb;">
                <img src="${data.url}" style="width:100%;">
                <div style="padding:10px;">
                    <p style="font-weight:bold;">İstifadəçi</p>
                    <p>${data.text || ""}</p>
                </div>
            </div>`;
    });
});
