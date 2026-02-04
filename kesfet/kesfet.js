import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, increment, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const container = document.getElementById('explore-container');

async function loadExplorePosts() {
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = (data.likedBy || []).includes(auth.currentUser?.uid);

            container.innerHTML += `
                <div class="explore-post">
                    <img src="${data.url}" ondblclick="handleLike('${id}')">
                    
                    <div class="side-actions">
                        <div class="action-btn" onclick="handleLike('${id}')">
                            <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                            <span>${data.likes || 0}</span>
                        </div>
                        <div class="action-btn">
                            <i class="fa-regular fa-comment"></i>
                            <span>${(data.comments || []).length}</span>
                        </div>
                    </div>

                    <div class="post-overlay">
                        <h3>@${data.userName}</h3>
                        <p>${data.text || ""}</p>
                    </div>
                </div>
            `;
        });
    });
}

window.handleLike = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    const postRef = doc(db, "posts", id);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists() && !(postSnap.data().likedBy || []).includes(user.uid)) {
        await updateDoc(postRef, {
            likes: increment(1),
            likedBy: arrayUnion(user.uid)
        });
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadExplorePosts();
    } else {
        window.location.href = "login.html";
    }
});
