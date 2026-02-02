// Paylaş düyməsinə basanda işləyən funksiya
async function sharePost() {
    const imageUrl = prompt("Paylaşmaq istədiyiniz şəklin linkini (URL) bura yapışdırın:");
    
    if (imageUrl) {
        try {
            // Məlumatı birbaşa Firestore-a yazırıq (Storage-ə ehtiyac yoxdur)
            await window.addDoc(window.collection(window.db, "posts"), {
                url: imageUrl,
                timestamp: window.serverTimestamp()
            });
            alert("Uğurla paylaşıldı! ✨");
        } catch (error) {
            console.error("Xəta:", error);
            alert("Paylaşım alınmadı. Firestore Rules-u yoxlayın.");
        }
    }
}

// HTML-dəki Paylaş düyməsini bu funksiyaya bağla
document.querySelector('.add-btn').onclick = sharePost;
