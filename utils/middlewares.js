import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";
import { TOKEN_EXPIRED_MSG, HTTP_403_MSG } from "../config.js";
import { deleteFile } from "./file-handlers.js";
import { CLIENT_ORIGIN } from "../constants.js";

export const verifyToken = (req, res = {}, next) => {
  const { applyRefresh } = res;
  const rToken = req.cookies.refresh_token
    ? req.cookies.refresh_token
    : undefined;

  const token = applyRefresh ? rToken?.jwt || rToken : req.cookies.access_token;

  const status = applyRefresh ? 403 : 401;
  const throwErr = next === undefined;
  if (!token) {
    const err = createError(TOKEN_EXPIRED_MSG, status);
    if (throwErr) throw err;
    else next(err);
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.clear();
      console.log(err.message, " verify token mid err");

      err = createError(
        applyRefresh ? HTTP_403_MSG : TOKEN_EXPIRED_MSG,
        status
      );
      if (throwErr) throw err;
      else next(err);
      return;
    }
    req.user = user;
    req.body && delete req.body._id;
    !throwErr && next();
  });
};

export const errHandler = (err, req, res, next) => {
  if (res.headersSent) {
    console.warn(
      "[SERVER_ERROR: HEADER SENT]",
      req.headers.origin,
      req.originalUrl,
      " at ",
      new Date()
    );
  } else {
    if (res.headersSent) return;

    if (req.timedout)
      err = createError(
        {
          message: err.message,
          code: err.code,
          details: {
            timeout: err.timeout
          }
        },
        err.statusCode || err.status
      );

    err = err.status
      ? err
      : (err.message ? (err.url = req.url || "-") : true) && createError(err);
    if (err) res.status(err.status).json(err);
  }

  if (req.file) deleteFile(req.file.publicUrl);
  if (req.files)
    for (const { publicUrl } of req.files) {
      deleteFile(publicUrl);
    }
};

export const validateCors = (origin = "", cb) => {
  origin = origin.headers ? origin.headers.origin : origin;

  console.log(origin, " orign...");

  if (
    true ||
    !origin ||
    origin === CLIENT_ORIGIN ||
    origin.toLowerCase().indexOf("localhost") > -1
  )
    cb(null, {
      origin: [
        "https://storage.googleapis.com/mern-demo-5cd45.appspot.com/medias%2F1699198641353-WhatsApp%20Image%202023-10-05%20at%203.27.22%20PM%20(1).jpeg",
        origin || CLIENT_ORIGIN
      ],
      optionsSuccessStatus: 200,
      credentials: true
    });
  else cb(createError(`Origin ${origin} blocked by cors`, 403));
};
