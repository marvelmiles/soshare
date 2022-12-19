import User from "../models/User.js";
import { createError } from "../utils/error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { setTokens } from "../utils/index.js";

export const signup = async (req, res, next) => {
  try {
    const user = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }]
    });
    if (user)
      return next(
        createError("A user with the specified username or email exist")
      );
    if (!req.body.password)
      return next(createError("A minimum of 8 character password is required"));
    req.body.password = await bcrypt.hash(
      req.body.password,
      await bcrypt.genSalt()
    );
    req.body.photoUrl = req.file?.publicUrl;
    await new User(req.body).save();
    res.json("Thank you for registering. You can login!");
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
    let user = await User.findOneAndUpdate(
      {
        $or: [
          { email: req.body.placeholder || req.body.email },
          {
            username: req.body.placeholder || req.body.username
          }
        ]
      },
      {
        isLogin: true
      },
      { new: true }
    );
    switch (req.body.provider) {
      case "google":
        if (user) break;
        req.body.isLogin = true;
        user = await new User(req.body).save();
        break;
      default:
        if (!user) return next(createError("User is not registered "));
        if (!(await bcrypt.compare(req.body.password, user.password)))
          return next(createError("Invalid credentials"));

        break;
    }
    await setTokens(res, user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const signout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isLogin: false
    });
    await setTokens(res);
    res.json("Signed out successfully");
  } catch (err) {
    next(err);
  }
};

export const userExist = async (req, res, next) => {
  try {
    return res.json(
      !!(await User.findOne({
        $or: [
          { email: req.body.placeholder },
          { username: req.body.placeholder }
        ]
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const refreshTokens = async (req, res, next) => {
  try {
    const err = await verifyToken(req, {
      _noNext: true,
      applyRefresh: true
    });
    if (err) return next(err);
    await setTokens(res, req.user.id);
    res.json("Token refreshed");
  } catch (err) {
    next(createError(err.message, 409));
  }
};

export const verifyToken = (req, res, next) => {
  const token = res.applyRefresh
    ? req.cookies.refresh_token
    : req.cookies.access_token;
  const status = res.applyRefresh ? 403 : 401;
  if (!token)
    return res._noNext
      ? createError(
          res.applyRefresh ? "Invalid credentials" : "You are not authorized",
          status
        )
      : next(
          createError(
            res.applyRefresh ? "Invalid credentials" : "You are not authorized",
            status
          )
        );

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res._noNext
        ? createError(
            res.applyRefresh
              ? "Refresh token is not valid. Please make a new signin request"
              : "Token is not valid!",
            staus
          )
        : next(
            createError(
              res.applyRefresh
                ? "Refresh token is not valid. Please make a new signin request"
                : "Token is not valid!",
              status
            )
          );
    req.user = user;
    !res._noNext && next();
  });
};
