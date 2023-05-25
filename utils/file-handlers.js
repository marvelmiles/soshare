import multer from "multer";
import { FIREBASE_BUCKET_NAME, GMAIL_USER } from "../config.js";
import { storage } from "../firebase.js";
import path from "path";
import nodemailer from "nodemailer";
import { createError } from "../utils/error.js";
import { Readable } from "stream";
import { getVideoDurationInSeconds } from "get-video-duration";

export const deleteFile = filePath => {
  filePath = decodeURIComponent(path.basename(filePath));
  return storage
    .bucket(FIREBASE_BUCKET_NAME)
    .file(filePath)
    .delete()
    .then(() => {})
    .catch(err => {
      console.error(
        `[Error Deleting ${filePath}]: ${err.message} at ${new Date()}.`
      );
      return err;
    });
};

export const uploadFile = (config = {}) => {
  config = {
    dirPath: "medias",
    type: "medias",
    single: false,
    defaultFieldName: "medias",
    ...config
  };
  return [
    (req, res, next) =>
      multer({
        storage: new multer.memoryStorage()
      })[config.single ? "single" : "array"](
        req.query.fieldName || config.defaultFieldName,
        Number(req.query.maxUpload) || 20
      )(req, res, next),
    async (req, res, next) => {
      try {
        config.maxDur = req.query.maxDur;
        config.maxSize = req.query.maxSize;
        if (req.file) req.file = await uploadToFirebase(req.file, config);
        else if (req.files) {
          const errs = [];
          for (let i = 0; i < req.files.length; i++) {
            try {
              req.files[i] = await uploadToFirebase(req.files[i], config);
            } catch (err) {
              if (req.query.sequentialEffect === "true") throw err;
              else {
                errs.push({
                  message: err.message,
                  status: err.status,
                  name: err.name,
                  code: err.code,
                  errIndex: i
                });
              }
            }
          }
          if (errs.length)
            throw createError({
              name: "customError",
              message: errs
            });
        }
        next();
      } catch (err) {
        next(err);
      }
    }
  ];
};

export const sendMail = (
  mailOptions,
  cb,
  service = "Gmail",
  user = GMAIL_USER,
  pass = process.env.GMAIL_PASSWORD
) => {
  const transporter = nodemailer.createTransport({
    service,
    auth: {
      user,
      pass
    }
  });
  transporter.sendMail(mailOptions, cb);
};

export const uploadToFirebase = (file, config = {}) => {
  return new Promise((resolve, reject) => {
    let isImg = config.type === "image";
    if (
      config.type &&
      !(config.type === "medias"
        ? (isImg = file.mimetype.indexOf("image") >= 0) ||
          file.mimetype.indexOf("video") >= 0
        : file.mimetype.indexOf(config.type) >= 0)
    )
      return reject(
        createError(`File mimetype ${file.mimetype} not supported`)
      );

    // 5gb max size limit
    config.maxSizeLimit = config.maxSizeLimit || 5000000000;
    config.maxSize = Number(config.maxSize) || config.maxSizeLimit;
    config.maxSize > config.maxSizeLimit &&
      (config.maxSize = config.maxSizeLimit);

    if (file.size > config.maxSize)
      return reject(createError(`max size of ${config.maxSize} exceeded`, 400));

    // 12h max duration
    config.maxDurLimit = config.maxDurLimit || 43200;
    config.maxDur = Number(config.maxDur) || config.maxDurLimit;
    config.maxDur > config.maxDurLimit && (config.maxDur = config.maxDurLimit);

    const handleError = err => {
      reject(createError(err));
    };
    const uploadFile = file => {
      const filename =
        `${config.dirPath ? config.dirPath + "/" : ""}` +
        Date.now() +
        "-" +
        file.originalname;
      const bucket = storage.bucket(FIREBASE_BUCKET_NAME);
      const fileRef = bucket.file(filename);
      const streamConfig = {
        metadata: {
          contentType: file.mimetype
        }
      };

      const handleSuccess = () => {
        file.filename = filename;
        fileRef
          .makePublic()
          .then(() => {
            file.publicUrl = fileRef.publicUrl();
            resolve(file);
          })
          .catch(handleError);
      };

      const outstream = fileRef.createWriteStream(streamConfig);
      if (file.stream) {
        file.stream.pipe(outstream);
      } else if (file.buffer) {
        outstream.write(file.buffer);
        outstream.end();
      }
      outstream.on("error", handleError);
      outstream.on("finish", handleSuccess);
    };

    if (!(file.buffer || file.stream))
      throw reject(createError(`Invalid file format`, 409));

    if (isImg || !config.maxDur) return uploadFile(file);
    const stream =
      file.stream ||
      new Readable({
        read() {
          this.push(file.buffer);
          this.push(null);
        }
      });
    getVideoDurationInSeconds(stream)
      .then(duration => {
        if (duration) {
          if (duration > config.maxDur)
            return reject(
              createError(`max duration of ${config.maxDur} exceeded`, 400)
            );
          uploadFile(file);
        } else uploadFile(file);
      })
      .catch(handleError);
  });
};
