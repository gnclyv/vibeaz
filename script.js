// Paylaşma funksiyası
async function startSharing() {
    const imageUrl = prompt("Şəkil linkini (URL) bura yapışdırın:");
    
    if (imageUrl && imageUrl.trim() !== "") {
        try {
            await window.addDoc(window.collection(window.db, "posts"), {
                url: imageUrl,
                timestamp: window.serverTimestamp()
            });
            alert("Uğurla paylaşıldı! ✨");
        } catch (error) {
            console.error("Xəta:", error);
            alert("Xəta: Firestore Rules-u yoxlayın!");
        }
    }
}

// Düymələrə klik hadisəsini bağlayırıq
document.getElementById('shareBtn').onclick = startSharing;
document.getElementById('mainAddBtn').onclick = startSharing;

// Postları canlı göstərmək
const postList = document.getElementById('post-list');
const q = window.query(window.collection(window.db, "posts"), window.orderBy("timestamp", "desc"));

window.onSnapshot(q, (snapshot) => {
    postList.innerHTML = '';
    snapshot.forEach((doc) => {
        const post = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                <img src="${post.url}" style="width:100%; border-radius:10px; display: block;">
                <p style="padding: 10px 0;">Yeni Vibe ⚡</p>
            </div>
        `;
    });
});
