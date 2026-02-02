import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. Firebase Konfiqurasiyası
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

// 2. İstifadəçi vəziyyətini izləyirik
onAuthStateChanged(auth, (user) => {
    if (user) {
        // İstifadəçi adını email-dən təmizləyirik (Məsələn: nihadgenceliyev776)
        const myUserName = user.email.split('@')[0]; 
        
        // HTML elementlərini doldururuq
        document.getElementById('header-username').innerText = myUserName;
        document.getElementById('profile-display-name').innerText = myUserName;
        document.getElementById('profile-email').innerText = user.email;

        // Postları yükləyən funksiyanı çağırırıq
        loadMyPosts(myUserName);
    } else {
        // Giriş edilməyibsə login səhifəsinə göndər
        window.location.href = "login.html";
    }
});

// 3. Postları real zamanda gətirən funksiya
function loadMyPosts(userName) {
    const grid = document.getElementById('user-posts-grid');
    const postCountElement = document.getElementById('post-count');

    // Firestore-da "userName" sahəsi bu istifadəçiyə bərabər olanları axtarırıq
    // DİQQƏT: Əgər burada "orderBy" istifadə etsən, Firebase Konsolunda "Index" yaratmalısan!
    const q = query(
        collection(db, "posts"), 
        where("userName", "==", userName)
    );

    // Real-time izləmə
    onSnapshot(q, (snapshot) => {
        grid.innerHTML = ""; // Mövcud gridi təmizləyirik
        let count = 0;

        snapshot.forEach((doc) => {
            count++;
            const data = doc.data();
            
            // Postu Grid-ə əlavə edirik
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${data.url}" alt="Post">
                </div>`;
        });

        // Ümumi post sayını yeniləyirik
        postCountElement.innerText = count;

        if (count === 0) {
            console.log("Hələ heç bir post paylaşılmayıb: ", userName);
        }
    }, (error) => {
        console.error("Postlar gələrkən xəta baş verdi: ", error);
        // Əgər "The query requires an index" xətası görsən, konsoldakı linkə kliklə
    });
}
