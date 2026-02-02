// Paylaş düyməsini tapırıq
const addBtn = document.querySelector('.add-btn');

addBtn.onclick = async () => {
    // İstifadəçidən link istəyirik
    const imageUrl = prompt("Şəkil linkini (URL) bura yapışdırın:");

    if (imageUrl) {
        try {
            // Firestore-a (posts kolleksiyasına) yazırıq
            await window.addDoc(window.collection(window.db, "posts"), {
                url: imageUrl,
                timestamp: window.serverTimestamp()
            });
            alert("Paylaşıldı! ✨");
            location.reload(); // Səhifəni yeniləyirik ki, yeni şəkil görünsün
        } catch (error) {
            console.error("Xəta:", error);
            alert("Xəta baş verdi! Firestore Rules-u (if true) yoxlayın.");
        }
    }
};

// Postları ekranda göstərmək üçün kod
const q = window.query(window.collection(window.db, "posts"), window.orderBy("timestamp", "desc"));
window.onSnapshot(q, (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    snapshot.forEach((doc) => {
        const post = doc.data();
        postList.innerHTML += `
            <div class="post-card">
                <img src="${post.url}" style="width:100%; border-radius:10px; margin-bottom:10px;">
                <p>Yeni paylaşım</p>
            </div>
        `;
    });
});
