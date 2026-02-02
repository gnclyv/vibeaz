import { arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. Şərh Əlavə Etmə Funksiyası
async function handleComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const commentText = commentInput.value.trim();

    if (commentText === "") return;

    const postRef = doc(db, "posts", postId);
    try {
        await updateDoc(postRef, {
            comments: arrayUnion({
                text: commentText,
                author: "İstifadəçi",
                timestamp: Date.now()
            })
        });
        commentInput.value = ""; // Yazı yerini təmizləyirik
    } catch (error) {
        console.error("Şərh xətası:", error);
    }
}

// 2. Postları Göstərmək (Şərh hissəsi ilə birlikdə)
firebaseOnSnapshot(firebaseQuery(firebaseCollection(db, "posts"), firebaseOrderBy("timestamp", "desc")), (snapshot) => {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

    snapshot.forEach(postDoc => {
        const data = postDoc.data();
        const postId = postDoc.id;
        const isLiked = likedPosts.includes(postId);
        const comments = data.comments || []; // Şərhləri alırıq

        let commentsHTML = "";
        comments.slice(-3).forEach(c => { // Son 3 şərhi göstəririk
            commentsHTML += `<p style="margin:2px 0; font-size:13px;"><strong>${c.author}</strong> ${c.text}</p>`;
        });

        postList.innerHTML += `
            <div class="post-card" style="margin-bottom:20px; background:white; border-radius:10px; border:1px solid #dbdbdb; overflow:hidden;">
                <div style="padding: 10px; font-weight:bold;">İstifadəçi</div>
                <img src="${data.url}" style="width:100%; display:block;" ondblclick="handleLike('${postId}')">
                
                <div style="padding:12px;">
                    <div style="display:flex; gap:15px; font-size:24px; margin-bottom:5px;">
                        <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                           style="cursor:pointer; color: ${isLiked ? '#ed4956' : 'black'};" 
                           onclick="handleLike('${postId}')"></i>
                        <i class="fa-regular fa-comment" style="cursor:pointer;" onclick="document.getElementById('comment-input-${postId}').focus()"></i>
                    </div>
                    <p style="margin:0 0 5px 0; font-weight:bold;">${data.likes || 0} bəyənmə</p>
                    <p style="margin:0 0 8px 0;"><strong>İstifadəçi</strong> ${data.text || ""}</p>
                    
                    <div id="comments-section-${postId}" style="border-top:1px solid #fafafa; padding-top:5px;">
                        ${commentsHTML}
                    </div>

                    <div style="display:flex; margin-top:10px; border-top:1px solid #efefef; padding-top:10px;">
                        <input type="text" id="comment-input-${postId}" placeholder="Şərh yaz..." 
                               style="border:none; outline:none; flex:1; font-size:14px;">
                        <button onclick="handleComment('${postId}')" 
                                style="border:none; background:none; color:#0095f6; font-weight:bold; cursor:pointer;">Paylaş</button>
                    </div>
                </div>
            </div>`;
    });
});

window.handleComment = handleComment;
window.handleLike = handleLike;
