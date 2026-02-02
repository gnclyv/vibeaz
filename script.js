import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, (user) => {
    if (user) {
        // 1. Ad və Email-i hər kəsə özəl yazdırırıq
        const userName = user.email.split('@')[0];
        document.getElementById('header-username').innerText = userName;
        document.getElementById('profile-display-name').innerText = userName;
        document.getElementById('profile-email').innerText = user.email;

        // 2. Real zamanda postları və sayını gətiririk
        loadMyData(userName);
    } else {
        window.location.href = "login.html";
    }
});

function loadMyData(userName) {
    const grid = document.getElementById('user-posts-grid');
    const postCountElement = document.getElementById('post-count');
    
    // Yalnız bu istifadəçinin postlarını axtarırıq
    const q = query(collection(db, "posts"), where("userName", "==", userName));

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = "";
        let count = 0;
        
        snapshot.forEach((doc) => {
            count++;
            const data = doc.data();
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${data.url}" alt="Post">
                </div>`;
        });
        
        // Post sayını real zamanda yeniləyirik
        postCountElement.innerText = count;
    });
}
