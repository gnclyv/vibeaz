import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

// 1. Recaptcha-nı hazırlayırıq
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { 
    'size': 'invisible' 
}, auth);

// 2. "Kod Göndər" düyməsi
document.getElementById('send-sms-btn').onclick = () => {
    const number = document.getElementById('phoneNumber').value;
    // Sənin HTML-dəki ID 'username' olduğu üçün buranı düzəltdik:
    const username = document.getElementById('username').value; 

    if (!username || number.length < 10) {
        alert("Zəhmət olmasa adınızı və nömrənizi tam daxil edin!");
        return;
    }

    const appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(auth, number, appVerifier)
        .then(res => {
            window.confirmationResult = res;
            window.tempUsername = username; // Adı keçici olaraq yadda saxla
            
            document.getElementById('login-step-1').style.display = 'none';
            document.getElementById('login-step-2').classList.remove('hidden');
            document.getElementById('login-step-2').style.display = 'block';
            console.log("SMS göndərildi!");
        }).catch(err => {
            alert("Xəta: " + err.message);
            // Xəta olarsa recaptcha-nı yenilə
            window.recaptchaVerifier.render().then(widgetId => {
                grecaptcha.reset(widgetId);
            });
        });
};

// 3. "Təsdiqlə" düyməsi
document.getElementById('verify-sms-btn').onclick = () => {
    const code = document.getElementById('smsCode').value;
    
    window.confirmationResult.confirm(code).then(async (result) => {
        const user = result.user;
        
        try {
            // Profil adını qeyd edirik
            await updateProfile(user, {
                displayName: window.tempUsername
            });
            
            // Məlumatların oturuşması üçün yeniləyirik
            await user.reload(); 
            
            console.log("Giriş uğurlu! Ad:", auth.currentUser.displayName);
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Profil yeniləmə xətası:", error);
            window.location.href = "index.html";
        }
    }).catch(() => alert("Kod yanlışdır!"));
};
