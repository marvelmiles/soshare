import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";
import { TOKEN_EXPIRED_MSG, HTTP_403_MSG } from "../config.js";

export const verifyToken = (req, res = {}, next) => {
  const { applyRefresh } = res;
  const rToken = req.cookies.refresh_token
    ? JSON.parse(req.cookies.refresh_token)
    : undefined;

  const token = applyRefresh ? rToken?.jwt : req.cookies.access_token;

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
