import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAs_F94p_TfI3m1fK69WwMog6C2v8",
    authDomain: "vibeaz-e866a.firebaseapp.com",
    projectId: "vibeaz-e866a",
    storageBucket: "vibeaz-e866a.appspot.com",
    messagingSenderId: "847253906231",
    appId: "1:847253906231:web:5c1a7686561334005b820a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. ReCAPTCHA-nı (Robot yoxlaması) görünməz şəkildə işə salırıq
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible'
}, auth);

// 2. Avtomatik Giriş Yoxlaması
onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app');

    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            authScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            console.log("Giriş uğurludur:", userDoc.data().username);
        }
    } else {
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

// 3. SMS Göndərmə
document.getElementById('send-sms-btn').onclick = () => {
    const username = document.getElementById('username').value;
    const number = document.getElementById('phoneNumber').value;

    if (!username || !number.startsWith('+')) {
        alert("Zəhmət olmasa ad daxil edin və nömrəni +994 formatında yazın!");
        return;
    }

    signInWithPhoneNumber(auth, number, window.recaptchaVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            document.getElementById('reg-form').classList.add('hidden');
            document.getElementById('verification-area').classList.remove('hidden');
            alert("Real SMS göndərildi! (Günlük limit: 10)");
        }).catch((error) => {
            alert("Xəta: " + error.message);
        });
};

// 4. Kodu Təsdiqləmə və Firestore-a Qeyd
document.getElementById('verify-sms-btn').onclick = () => {
    const code = document.getElementById('smsCode').value;
    const username = document.getElementById('username').value;

    window.confirmationResult.confirm(code).then(async (result) => {
        // İstifadəçini bazaya yazırıq ki, birdə qeydiyyat istəməsin
        await setDoc(doc(db, "users", result.user.uid), {
            username: username,
            phoneNumber: result.user.phoneNumber,
            createdAt: new Date()
        });
        
        location.reload();
    }).catch(() => {
        alert("Kod səhvdir!");
    });
};

// 5. Çıxış
document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => location.reload());
};


