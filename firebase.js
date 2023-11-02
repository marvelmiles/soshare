import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

export const firebaseCredential = admin.credential.cert({
  type: "service_account",
  project_id: "mern-demo-5cd45",
  private_key_id: process.env.REACT_APP_FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email:
    "firebase-adminsdk-lrqho@mern-demo-5cd45.iam.gserviceaccount.com",
  client_id: "114832195068657243257",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-lrqho%40mern-demo-5cd45.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
});

admin.initializeApp({
  credential: firebaseCredential
});

export const storage = admin.storage();

export default admin;
