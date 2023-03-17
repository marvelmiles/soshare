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
    if (!req.body.password || req.body.password.length < 8)
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
    console.log("signin...");
    const query = {
      $or: [
        { email: req.body.placeholder || req.body.email },
        {
          username: req.body.placeholder || req.body.username
        }
      ]
    };
    let user = await User.findOne(query);
    switch (req.body.provider) {
      case "google":
        if (user) break;
        user = await new User(req.body).save();
        break;
      default:
        if (!user) throw createError("User is not registered");
        if (!req.body.password) throw createError("Your password is required");
        if (!(await bcrypt.compare(req.body.password, user.password || "")))
          throw createError("Invalid credentials");
        break;
    }
    await setTokens(res, user.id, req.query.rememberMe);
    user &&
      (await user.updateOne({
        isLogin: true
      }));
    res.json(await User.findOne(query));
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
          { email: req.body.placeholder || req.body.email },
          { username: req.body.placeholder || req.body.username }
        ]
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const refreshTokens = async (req, res, next) => {
  try {
    const err = verifyToken(
      req,
      {
        applyRefresh: true
      },
      next
    );
    if (err) return next(err);

    // console.log(req.user, "reee user");
    await setTokens(res, req.user.id, req.cookies.refresh_token.rememberMe);
    res.json("Token refreshed");
  } catch (err) {
    console.log("dddddd", err.message);
    next(err);
  }
};

export const verifyToken = (req, { applyRefresh, _noNext, throwErr }, next) => {
  console.log("verifiying...");
  const token = applyRefresh
    ? req.cookies.refresh_token?.jwt
    : req.cookies.access_token;
  const status = applyRefresh ? 403 : 401;
  _noNext = _noNext || applyRefresh;
  if (!token)
    return _noNext
      ? createError(
          applyRefresh ? "Invalid credentials" : "You are not authorized",
          status
        )
      : next(
          createError(
            applyRefresh ? "Invalid credentials" : "You are not authorized",
            status
          )
        );

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log(err.message, !!_noNext);
      if (_noNext)
        if (throwErr)
          throw createError(
            applyRefresh
              ? "Refresh token is not valid. Please make a new signin request"
              : "Token is not valid!",
            status
          );
        else
          next(
            createError(
              applyRefresh
                ? "Refresh token is not valid. Please make a new signin request"
                : "Token is not valid!",
              status
            )
          );
      return;
    }
    console.log("user verified...");
    req.user = user;
    delete req.body._id;
    !_noNext && next();
  });
};
