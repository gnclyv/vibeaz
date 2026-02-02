import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. İstifadəçi adını email-dən təmizləyirik
        const cleanName = user.email.split('@')[0]; 
        
        // 2. Header-dəki adları yeniləyirik
        document.getElementById('header-username').innerText = cleanName;
        document.getElementById('profile-email').innerText = user.email;

        // 3. Profil şəkli və xüsusi adı Firestore-dan çəkirik
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('profile-display-name').innerText = userData.displayName || cleanName;
            document.getElementById('user-avatar').src = userData.photoURL;
            document.getElementById('nav-avatar').src = userData.photoURL;
        } else {
            document.getElementById('profile-display-name').innerText = cleanName;
            document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${cleanName}`;
            document.getElementById('nav-avatar').src = `https://ui-avatars.com/api/?name=${cleanName}`;
        }

        // 4. POSTLARI YÜKLƏYƏN FUNKSİYANI ÇAĞIRIRIQ
        loadUserPosts(cleanName);
    } else {
        window.location.href = "login.html";
    }
});

function loadUserPosts(userNameToFind) {
    const grid = document.getElementById('user-posts-grid');
    
    // Firestore-da "posts" kolleksiyasında "userName" sahəsini yoxlayırıq
    // DİQQƏT: Bu filtr bazadakı adla eyni olmalıdır!
    const q = query(collection(db, "posts"), where("userName", "==", userNameToFind));

    onSnapshot(q, (snap) => {
        grid.innerHTML = "";
        let totalPosts = 0;
        
        snap.forEach((doc) => {
            totalPosts++;
            const postData = doc.data();
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${postData.url}" alt="Post">
                </div>`;
        });
        
        document.getElementById('post-count').innerText = totalPosts;

        // Əgər post yoxdursa konsolda yoxlamaq üçün mesaj
        if(totalPosts === 0) {
            console.log("Post tapılmadı. Axtarılan ad: " + userNameToFind);
        }
    }, (error) => {
        console.error("Firebase xətası: ", error);
    });
}
