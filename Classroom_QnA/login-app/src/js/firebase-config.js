// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, push, onValue, set, connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzp-k4RrobA2Xss1UokUlOAwogQ49C-zI",
    authDomain: "classroom-qna.firebaseapp.com",
    databaseURL: "https://classroom-qna-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "classroom-qna",
    storageBucket: "classroom-qna.firebasestorage.app",
    messagingSenderId: "193380293492",
    appId: "1:193380293492:web:2129fcedd52b59eb0dea21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Test database connection
const connectedRef = ref(database, '.info/connected');
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        console.log('Connected to Firebase');
    } else {
        console.log('Not connected to Firebase');
    }
});

export { database, ref, push, onValue, set };