import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase Konfiqurasiyası
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

// İstifadəçi vəziyyətini izləyirik
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. İstifadəçi adını email-dən təmizləyirik (Emailin @-ə qədər olan hissəsi)
        const cleanName = user.email.split('@')[0]; 
        
        // 2. HTML-dəki adları və email-i yeniləyirik
        document.getElementById('header-username').innerText = cleanName;
        document.getElementById('profile-display-name').innerText = cleanName;
        document.getElementById('profile-email').innerText = user.email;

        // 3. Postları real zamanda yükləyirik
        loadUserPosts(cleanName);
    } else {
        // Giriş edilməyibsə login səhifəsinə yönləndir
        window.location.href = "login.html";
    }
});

/**
 * Postları Firestore-dan "userName" sahəsinə görə filtrləyib gətirir
 */
function loadUserPosts(userNameToFind) {
    const grid = document.getElementById('user-posts-grid');
    const postCountText = document.getElementById('post-count');
    
    // Yalnız bu istifadəçiyə aid postları tapırıq
    const q = query(collection(db, "posts"), where("userName", "==", userNameToFind));

    // Real-time izləmə (Snapshot)
    onSnapshot(q, (snapshot) => {
        grid.innerHTML = ""; // Köhnə postları təmizlə
        let count = 0;
        
        snapshot.forEach((doc) => {
            count++;
            const postData = doc.data();
            
            // Postu Grid-ə əlavə edirik
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${postData.url}" alt="VibeAz Post">
                </div>`;
        });
        
        // Post sayını yeniləyirik
        postCountText.innerText = count;

        // Konsolda yoxlama üçün mesaj
        if (count === 0) {
            console.log("Post tapılmadı. Axtarılan userName: " + userNameToFind);
        }
    }, (error) => {
        console.error("Postlar yüklənərkən xəta baş verdi: ", error);
        // Əgər burada 'index' xətası alırsansa, konsoldakı linkə klikləməlisən
    });
}
