import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";
import { TOKEN_EXPIRED_MSG, HTTP_403_MSG } from "../config.js";
import { deleteFile } from "./file-handlers.js";

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
