// Paylaşma funksiyası
async function uploadToFirebase(type) {
    const imageUrl = prompt(type === 'stories' ? "Story üçün şəkil linki:" : "Post üçün şəkil linki:");
    
    if (imageUrl && imageUrl.trim() !== "") {
        let captionText = ""; // Standart boş söz
        
        // Əgər postdursa, istifadəçidən yazı soruşuruq
        if (type === 'posts') {
            captionText = prompt("Post üçün başlığı yazın (məs: Bu gün çox şəndir):");
        }

        try {
            await window.addDoc(window.collection(window.db, type), {
                url: imageUrl,
                text: captionText || (type === 'posts' ? "Yeni Vibe ⚡" : ""), // Postdursa və boşdursa standart yazı
                timestamp: window.serverTimestamp()
            });
            alert("Uğurla paylaşıldı! ✨");
        } catch (error) {
            alert("Xəta: Firestore Rules-u yoxlayın!");
        }
    }
}

// Postları Aşağıda Göstərmək hissəsini bu şəkildə dəyiş (data.text əlavə edildi):
window.onSnapshot(qPosts, (snapshot) => {
    postList.innerHTML = '';
    snapshot.forEach((doc) => {
        const post = doc.data();
        postList.innerHTML += `
            <div class="post-card" style="margin-bottom: 20px; border-bottom: 1px solid #eee; background: white;">
                <img src="${post.url}" style="width:100%; border-radius:10px;">
                <p style="padding:10px; font-weight: 500; color: #262626;">
                    ${post.text ? post.text : ""}
                </p>
            </div>`;
    });
});
