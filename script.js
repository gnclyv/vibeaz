import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app');

// İstifadəçi statusunu yoxla
onAuthStateChanged(auth, (user) => {
    if (user) {
        authScreen.style.display = 'none';
        appScreen.style.display = 'block';
        loadPosts();
    } else {
        authScreen.style.display = 'flex';
        appScreen.style.display = 'none';
    }
});

// Qeydiyyat
document.getElementById('register-btn').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById
