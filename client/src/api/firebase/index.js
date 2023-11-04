import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATXDAFfOzi0c7kkQi0KjSDAk4znRJ2c0g",
  authDomain: "mern-demo-5cd45.firebaseapp.com",
  projectId: "mern-demo-5cd45",
  storageBucket: "mern-demo-5cd45.appspot.com",
  messagingSenderId: "169582668963",
  appId: "1:169582668963:web:56eb747a4bc797a7886316",
  measurementId: "G-5Q0WCJ74VN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();

export const googleProvider = new GoogleAuthProvider();

export const signInWithPopupTimeout = (timeout = 60000) => {
  return new Promise((resolve, reject) => {
    // const id = setTimeout(() => {
    //   reject("Request timedout!");
    //   clearTimeout(id);
    // }, timeout);
    signInWithPopup(auth, googleProvider)
      .then(result => {
        // clearTimeout(id);
        resolve(result);
      })
      .catch(err => {
        // clearTimeout(id);
        reject(err);
      });
  });
};

export default app;
