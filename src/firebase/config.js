import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
    apiKey: "AIzaSyCfmYeArOGyhvcDJWhsyk8g9RF3OngD_wQ",
    authDomain: "alive-skin-da29a.firebaseapp.com",
    projectId: "alive-skin-da29a",
    storageBucket: "alive-skin-da29a.appspot.com",
    messagingSenderId: "546327095982",
    appId: "1:546327095982:web:eb03cdd24ad53f8cd69b3f",
    measurementId: "G-4SGJ2MT669"
  };

export const firebase = getApps.length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebase);

export const storage = getStorage(firebase);