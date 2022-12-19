import multer from "multer";
import FirebaseStorage from "multer-firebase-storage";
import { FIREBASE_BUCKET_NAME } from "../config.js";
import firebase, { firebaseCredential } from "../firebase.js";

export const deleteFile = async filePath => {
  return await firebase
    .storage()
    .bucket(FIREBASE_BUCKET_NAME)
    .file(decodeURIComponent(filePath))
    .delete();
};

export const uploadFile = (
  config = {
    dirPath: "medias",
    type: "image video",
    single: false
  }
) => {
  return (req, res, next) => {
    return multer({
      storage: FirebaseStorage({
        directoryPath: config.dirPath,
        bucketName: FIREBASE_BUCKET_NAME,
        credentials: firebaseCredential,
        unique: true,
        public: true
      }),
      fileFilter: (_, file, cb) => {
        console.log(file);
        cb(null, file.mimetype.indexOf(config.type) >= 0);
      }
    })[config.single ? "single" : "array"](
      req.query.fieldName || "medias",
      Number(req.query.maxUpload) || 20
    )(req, res, next);
  };
};
