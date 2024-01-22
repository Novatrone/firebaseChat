import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyB50_Ei-DZA_q2cnPk79zIqXw39daZNNPc",
    authDomain: "learning-react-5b450.firebaseapp.com",
    projectId: "learning-react-5b450",
    storageBucket: "learning-react-5b450.appspot.com",
    messagingSenderId: "694304881346",
    appId: "1:694304881346:web:45c93e7efb9de8382c995b",
    measurementId: "G-ZC203K1QDW"
};

export const firebase = getApps.length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebase);