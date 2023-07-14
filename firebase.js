import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

export const firebaseCredential = admin.credential.cert({
  type: "service_account",
  project_id: "mern-social-1842b",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email:
    "firebase-adminsdk-6ispt@mern-social-1842b.iam.gserviceaccount.com",
  client_id: "117942313971374360682",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-6ispt%40mern-social-1842b.iam.gserviceaccount.com"
});

admin.initializeApp({
  credential: firebaseCredential
});

export const storage = admin.storage();

export default admin;
