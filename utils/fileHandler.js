import multer from "multer";
import FirebaseStorage from "multer-firebase-storage";
import { FIREBASE_BUCKET_NAME } from "../config.js";
import firebase, { firebaseCredential } from "../firebase.js";
import path from "path";

export const deleteFile = filePath => {
  filePath = decodeURIComponent(path.basename(filePath));
  return firebase
    .storage()
    .bucket(FIREBASE_BUCKET_NAME)
    .file(filePath)
    .delete()
    .catch(err =>
      console.error(
        `[Error Deleting ${filePath}]: ${err.message} at ${new Date()}.`
      )
    );
};

export const uploadFile = (config = {}) => {
  config = {
    dirPath: "medias",
    type: "medias",
    single: false,
    defaultFieldName: "medias",
    ...config
  };
  return (req, res, next) => {
    return multer({
      storage: FirebaseStorage({
        directoryPath: config.dirPath,
        bucketName: FIREBASE_BUCKET_NAME,
        credentials: firebaseCredential,
        unique: true,
        public: true,
        hooks: {
          beforeUpload(req, file) {
            console.log(req.body, file.originalname, "before upload");
          },
          afterUpload(req, file) {
            console.log(req.body, file.originalname, "after upload");
          }
        }
      }),
      fileFilter: (_, file, cb) => {
        console.log("file filtering.. ", file.originalname, file.mimetype);
        cb(
          null,
          config.type === "medias"
            ? file.mimetype.indexOf("image") >= 0 ||
                file.mimetype.indexOf("video") >= 0
            : file.mimetype.indexOf(config.type) >= 0
        );
      }
    })[config.single ? "single" : "array"](
      req.query.fieldName || config.defaultFieldName,
      Number(req.query.maxUpload) || 20
    )(req, res, next);
  };
};
