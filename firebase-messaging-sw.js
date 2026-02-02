importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    projectId: "vibeaz-1e98a",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
});

const messaging = firebase.messaging();

// Arxa planda mesaj gələndə nə baş versin
messaging.onBackgroundMessage((payload) => {
    console.log('Arxa planda mesaj alındı: ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vibeaz_logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
