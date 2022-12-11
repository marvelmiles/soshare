import multer from "multer";
/* FILE STORAGE */
// temp-->moving to firebase later
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
export const uploadFile = (type, directoryPath = "videos") => {
  return (req, res, next) => {
    return multer({
      storage,

      fileFilter: (_, file, cb) => {
        cb(null, file.mimetype.indexOf(type) >= 0);
      }
    }).array(
      req.query.fieldName || "videos",
      Number(req.query.maxUpload) || 20
    )(req, res, next);
  };
};

// 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;
