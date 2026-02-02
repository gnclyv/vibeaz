const db = window.db;
const collection = window.collection;
const addDoc = window.addDoc;
const query = window.query;
const orderBy = window.orderBy;
const onSnapshot = window.onSnapshot;
const serverTimestamp = window.serverTimestamp;

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.click(); 

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        alert("Şəkil emal olunur...");

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

            await addDoc(collection(db, type), {
                url: imageUrl,
                text: userText || "",
                timestamp: serverTimestamp()
            });

            alert("Paylaşıldı!");
        } catch (error) {
            alert("Xəta baş verdi!");
        }
    };
}

document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');

// Story-ləri gətirən hissə
onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snapshot) => {
    const storyContainer = document.getElementById('stories');
    storyContainer.innerHTML = '<div class="story-card add-btn" id="shareBtn"><div class="story-circle">+</div><span>Paylaş</span></div>';
    snapshot.forEach(doc => {
        const data = doc.data();
        storyContainer.innerHTML += `
            <div class="story-card">
                <div class="story-circle"><img src="${data.url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></div>
                <span>İstifadəçi</span>
            </div>`;
    });
    document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
});

// Postları gətirən hissə
onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post-card">
                <p style="font-weight:bold; padding:10px;">İstifadəçi</p>
                <img src="${data.url}" style="width:100%;">
                <p style="padding:10px;">${data.text || ""}</p>
            </div>`;
    });
});
