import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
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
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// İstifadəçi vəziyyətini izləyirik
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Mövcud məlumatları tətbiq edirik
        const cleanName = user.displayName || user.email.split('@')[0]; 
        
        document.getElementById('header-username').innerText = cleanName;
        document.getElementById('profile-display-name').innerText = cleanName;
        document.getElementById('profile-email').innerText = user.email;
        
        // Profil şəkillərini Firebase-dən gələnə görə yeniləyirik
        if(user.photoURL) {
            document.getElementById('main-profile-img').src = user.photoURL;
            if(document.getElementById('nav-img')) document.getElementById('nav-img').src = user.photoURL;
        }

        loadUserPosts(cleanName);
    } else {
        window.location.href = "login.html";
    }
});

/**
 * Postları Firestore-dan "userName" sahəsinə görə filtrləyib gətirir
 */
function loadUserPosts(userNameToFind) {
    const grid = document.getElementById('user-posts-grid');
    const postCountText = document.getElementById('post-count');
    
    const q = query(collection(db, "posts"), where("userName", "==", userNameToFind));

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = ""; 
        let count = 0;
        
        snapshot.forEach((doc) => {
            count++;
            const postData = doc.data();
            
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${postData.url}" alt="VibeAz Post">
                </div>`;
        });
        
        postCountText.innerText = count;
    }, (error) => {
        console.error("Postlar yüklənərkən xəta: ", error);
    });
}

// --- BURADAN AŞAĞI REDAKTƏ FUNKSİYALARI ƏLAVƏ EDİLDİ (SİLMƏDƏN) ---

const modal = document.getElementById('editProfileModal');
const editBtn = document.getElementById('edit-profile-btn');
const closeBtn = document.getElementById('close-modal-btn');
const fileInput = document.getElementById('edit-avatar-input');
const saveBtn = document.getElementById('save-profile-changes');
const previewImg = document.getElementById('modal-preview-img');
const nameInput = document.getElementById('edit-display-name');

// Modalı aç
if(editBtn) {
    editBtn.onclick = () => {
        const user = auth.currentUser;
        if(user) {
            nameInput.value = user.displayName || user.email.split('@')[0];
            previewImg.src = user.photoURL || "https://i.ibb.co/G4NSB49X/Gemini-Generated-mage-q3dek6q3dek6q3de.png";
            modal.style.display = 'flex';
        }
    };
}

// Modalı bağla
if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

// Şəkil seçimi
if(document.getElementById('change-photo-btn')) {
    document.getElementById('change-photo-btn').onclick = () => fileInput.click();
}

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if(file) previewImg.src = URL.createObjectURL(file);
};

// Məlumatları yadda saxla
saveBtn.onclick = async () => {
    const user = auth.currentUser;
    if(!user) return;

    saveBtn.innerText = "Yadda saxlanılır...";
    saveBtn.disabled = true;

    let finalPhotoURL = user.photoURL;

    try {
        // 1. Əgər yeni şəkil seçilibsə ImgBB-yə yüklə
        if(fileInput.files[0]) {
            const fd = new FormData();
            fd.append("image", fileInput.files[0]);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();
            if(result.success) finalPhotoURL = result.data.url;
        }

        // 2. Firebase Profilini yenilə
        await updateProfile(user, {
            displayName: nameInput.value,
            photoURL: finalPhotoURL
        });

        alert("Profil uğurla yeniləndi!");
        location.reload();
    } catch (error) {
        console.error("Yeniləmə xətası:", error);
        alert("Xəta baş verdi!");
        saveBtn.innerText = "Yadda saxla";
        saveBtn.disabled = false;
    }
};
