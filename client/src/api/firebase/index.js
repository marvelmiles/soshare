import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "mern-social-1842b.firebaseapp.com",
  projectId: "mern-social-1842b",
  storageBucket: "mern-social-1842b.appspot.com",
  messagingSenderId: "133828890571",
  appId: "1:133828890571:web:d2882289bcf7b366e0b04e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();

export const googleProvider = new GoogleAuthProvider();

export const signInWithPopupTimeout = (timeout = 60000) => {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject("Request timeout!");
      clearTimeout(id);
    }, timeout);
    signInWithPopup(auth, googleProvider)
      .then(result => {
        clearTimeout(id);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(id);
        reject(err);
      });
  });
};

export default app;
