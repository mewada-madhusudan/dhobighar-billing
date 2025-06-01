import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyB0wSptyQ9uyAyj8Oj7BqHpP_zxqYS077g",
    authDomain: "dhobighar-billing.firebaseapp.com",
    projectId: "dhobighar-billing",
    storageBucket: "dhobighar-billing.firebasestorage.app",
    messagingSenderId: "965539819967",
    appId: "1:965539819967:web:de1b94fba1886ee9bef10a",
    measurementId: "G-S632HFQXHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
