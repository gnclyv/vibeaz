import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

// 2. Recaptcha-nı hazırlayırıq (Görünməz rejim)
if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { 
        'size': 'invisible' 
    }, auth);
}

// 3. SMS Kodunu Göndərmə
document.getElementById('send-sms-btn').onclick = () => {
    const number = document.getElementById('phoneNumber').value;
    const username = document.getElementById('username').value; // HTML-dəki id="username" ilə uyğunlaşdırıldı

    if (!username || number.length < 10) {
        alert("Zəhmət olmasa adınızı və nömrənizi tam daxil edin!");
        return;
    }

    const appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(auth, number, appVerifier)
        .then(res => {
            window.confirmationResult = res;
            window.tempUsername = username; // Adı keçici olaraq yadda saxlayırıq
            
            // Addımlar arası keçid
            document.getElementById('login-step-1').classList.add('hidden');
            document.getElementById('login-step-2').classList.remove('hidden');
            console.log("SMS göndərildi!");
        }).catch(err => {
            console.error("SMS Xətası:", err.message);
            alert("Xəta: " + err.message);
            // Xəta olarsa recaptcha-nı sıfırla
            if (window.grecaptcha) {
                window.grecaptcha.reset();
            }
        });
};

// 4. SMS Kodunu Təsdiqləmə və Profil Adını Yazma
document.getElementById('verify-sms-btn').onclick = () => {
    const code = document.getElementById('smsCode').value;
    
    if (code.length !== 6) {
        alert("6 rəqəmli kodu daxil edin!");
        return;
    }

    window.confirmationResult.confirm(code).then(async (result) => {
        const user = result.user;
        
        try {
            // FIREBASE PROFILINI YENILƏYIRIK
            // Bu hissə 'Anonim' yazılmasının qarşısını alır
            await updateProfile(user, {
                displayName: window.tempUsername
            });
            
            // Profil məlumatlarının bazadan yenidən çəkilməsini təmin edirik
            await user.reload(); 
            
            console.log("Giriş uğurlu! İstifadəçi adı:", auth.currentUser.displayName);
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Profil yeniləmə xətası:", error);
            // Xəta olsa belə ana səhifəyə göndər, amma ad düşməyə bilər
            window.location.href = "index.html";
        }
    }).catch(err => {
        console.error("Kod təsdiq xətası:", err);
        alert("Kod yanlışdır və ya vaxtı keçib!");
    });
};
