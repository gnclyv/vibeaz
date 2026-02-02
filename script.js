const fileInput = document.getElementById('fileInput');
const postList = document.getElementById('post-list');
const storyList = document.getElementById('stories');

// REAL TIME DİNLƏMƏ (Postlar)
const q = query(collection(window.db, "vibes"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    postList.innerHTML = "";
    snapshot.forEach((doc) => {
        const data = doc.data();
        postList.innerHTML += `
            <div class="post">
                <div class="post-user">@nihad_vibe</div>
                <img src="${data.imageUrl}" class="post-img">
                <div class="post-bar"><i class="fa-regular fa-heart"></i> <i class="fa-regular fa-comment"></i></div>
            </div>
        `;
    });
});

// ŞƏKİL SEÇİLƏNDƏ YÜKLƏ
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(window.storage, 'uploads/' + Date.now());
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(window.db, "vibes"), {
        imageUrl: url,
        createdAt: serverTimestamp()
    });
});