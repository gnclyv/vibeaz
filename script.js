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

window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' }, auth);

document.getElementById('send-sms-btn').onclick = () => {
    const number = document.getElementById('phoneNumber').value;
    const username = document.getElementById('usernameInput').value; // HTML-də bu ID-li input olduğundan əmin ol

    if (!username || !number) {
        alert("Ad və nömrə daxil edin!");
        return;
    }

    signInWithPhoneNumber(auth, number, window.recaptchaVerifier)
        .then(res => {
            window.confirmationResult = res;
            window.tempUsername = username;
            document.getElementById('login-step-1').classList.add('hidden');
            document.getElementById('login-step-2').classList.remove('hidden');
        }).catch(err => alert("Xəta: " + err.message));
};

document.getElementById('verify-sms-btn').onclick = () => {
    const code = document.getElementById('smsCode').value;
    window.confirmationResult.confirm(code).then(async (result) => {
        // Profil adını yeniləyirik
        await updateProfile(result.user, {
            displayName: window.tempUsername
        });
        await result.user.reload(); // Adın yadda qaldığına əmin oluruq
        window.location.href = "index.html"; 
    }).catch(() => alert("Kod yanlışdır!"));
};
