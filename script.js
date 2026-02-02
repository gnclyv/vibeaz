import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Sənin yeni və düzgün konfiqurasiyan
const firebaseConfig = {
  apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
  authDomain: "vibeaz-1e98a.firebaseapp.com",
  databaseURL: "https://vibeaz-1e98a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vibeaz-1e98a",
  storageBucket: "vibeaz-1e98a.firebasestorage.app",
  messagingSenderId: "953434260285",
  appId: "1:953434260285:web:6263b4372487ba6d673b54",
  measurementId: "G-2928WJCY1B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ReCAPTCHA qurulur
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible'
}, auth);

// Giriş yoxlaması
onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app');
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            authScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
        }
    } else {
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

// SMS Göndərmə
document.getElementById('send-sms-btn').onclick = () => {
    const username = document.getElementById('username').value;
    const number = document.getElementById('phoneNumber').value;

    if (!username || !number.startsWith('+')) {
        alert("Adı daxil edin və nömrəni +994 formatında yazın!");
        return;
    }

    signInWithPhoneNumber(auth, number, window.recaptchaVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            document.getElementById('reg-form').classList.add('hidden');
            document.getElementById('verification-area').classList.remove('hidden');
        }).catch((error) => {
            alert("Xəta: " + error.message);
        });
};

// Təsdiqləmə
document.getElementById('verify-sms-btn').onclick = () => {
    const code = document.getElementById('smsCode').value;
    const username = document.getElementById('username').value;

    window.confirmationResult.confirm(code).then(async (result) => {
        await setDoc(doc(db, "users", result.user.uid), {
            username: username,
            phoneNumber: result.user.phoneNumber,
            createdAt: new Date()
        });
        location.reload();
    }).catch(() => alert("Kod səhvdir!"));
};

// Çıxış
document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => location.reload());
};
