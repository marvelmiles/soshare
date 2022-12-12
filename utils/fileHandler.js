import multer from "multer";
/* FILE STORAGE */
// temp-->moving to firebase later
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function(req, file, cb) {
    console.log("ddd");
    cb(null, file.originalname);
  }
});
export const uploadFile = ({
  type = "image",
  single = true,
  dir = "photos"
}) => {
  return (req, res, next) => {
    return multer({
      storage,
      fileFilter: (_, file, cb) => {
        cb(null, file.mimetype.indexOf(type) >= 0);
      }
    })[single ? "single" : "array"](
      req.query.fieldName,
      Number(req.query.maxUpload) || 20
    )(req, res, next);
  };
};
