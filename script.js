import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. Firebase Məlumatların
const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Ana Səhifə Postlarını Yükləyən Funksiya
function loadFeed() {
    const postsContainer = document.getElementById('posts-container'); // HTML-dəki id ilə eyni olmalıdır
    
    // Bütün postları tarixinə görə sıralayırıq
    // Əgər "orderBy" xətası versə, konsoldakı linkə klikləyib index yaratmalısan
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        postsContainer.innerHTML = ""; // Ekranı təmizləyirik

        if (snapshot.empty) {
            postsContainer.innerHTML = "<p style='text-align:center; padding:50px;'>Hələ heç bir paylaşım yoxdur.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const post = doc.data();
            
            // Post kartının dizaynı
            postsContainer.innerHTML += `
                <div class="post-card" style="margin-bottom: 20px; border-bottom: 1px solid #262626; background: #000;">
                    <div class="post-header" style="display:flex; align-items:center; padding:10px;">
                        <img src="vibeaz_logo.png" style="width:32px; height:32px; border-radius:50%; margin-right:10px;">
                        <span style="font-weight:bold; font-size:14px;">${post.userName || 'İstifadəçi'}</span>
                    </div>
                    <img src="${post.url}" style="width:100%; display:block;" alt="VibeAz Post">
                    <div class="post-footer" style="padding:10px;">
                        <p style="font-size:14px;"><strong>${post.userName || 'İstifadəçi'}</strong> ${post.caption || ''}</p>
                    </div>
                </div>
            `;
        });
    }, (error) => {
        console.error("Məlumat gələrkən xəta: ", error);
        // Ekran qara qalmasın deyə xətanı istifadəçiyə bildiririk
        document.getElementById('posts-container').innerHTML = "<p style='color:red; text-align:center;'>Postlar yüklənə bilmədi. Firebase İndeksi yoxla!</p>";
    });
}

// Səhifə açılan kimi postları yüklə
loadFeed();
