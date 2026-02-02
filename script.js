// 1. Firebase funksiyaları
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
    const loader = document.getElementById('loader');
    
    fileInput.value = ""; 
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        // Loader-i göstər
        loader.style.setProperty("display", "flex", "important");

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
                loader.style.display = "none";
                userText = prompt("Post üçün başlıq yazın:") || "";
                loader.style.setProperty("display", "flex", "important");
            }

            // Məlumatı bazaya "İstifadəçi" adı ilə göndəririk
            await addDoc(collection(db, type), {
                url: imageUrl,
                text: userText,
                author: "İstifadəçi", 
                timestamp: serverTimestamp()
            });

            loader.style.display = "none";
            alert("Uğurla paylaşıldı! ✨");

        } catch (error) {
            loader.style.display = "none";
            alert("Xəta: " + error.message);
        }
    };
}

document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// 4. Story-ləri göstər
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
                <span>İstifadəçi</span>
            </div>`;
    });
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// 5. Postları göstər
onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; overflow:hidden; border:1px solid #dbdbdb;">
                <div style="padding: 10px; font-weight: bold; display: flex; align-items: center;">
                   <div style="width:30px; height:30px; background:#efefef; border-radius:50%; margin-right:10px; display:flex; align-items:center; justify-content:center;">
                      <i class="fa fa-user" style="color:#ccc; font-size:12px;"></i>
                   </div>
                   İstifadəçi
                </div>
                <img src="${data.url}" style="width:100%; display: block;">
                <div style="padding:12px;">
                    <p style="margin:0;">
                        <strong>İstifadəçi</strong> ${data.text || ""}
                    </p>
                </div>
            </div>`;
    });
});
