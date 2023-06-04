import User from "../models/User.js";
import { createError } from "../utils/error.js";
import bcrypt from "bcrypt";
import { setTokens, generateToken } from "../utils/index.js";
import { isEmail } from "../utils/validators.js";
import { sendMail } from "../utils/file-handlers.js";
import { verifyToken } from "../utils/middlewares.js";
import { GMAIL_USER } from "../config.js";
export const signup = async (req, res, next) => {
  try {
    if (!isEmail(req.body.email))
      throw createError("Account email address is invalid");
    let user = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }]
    });
    if (user)
      throw createError("A user with the specified username or email exist");

    if (!req.body.password || req.body.password.length < 8)
      throw createError("A minimum of 8 character password is required");
    req.body.password = await bcrypt.hash(
      req.body.password,
      await bcrypt.genSalt()
    );
    req.body.photoUrl = req.file?.publicUrl;
    user = await new User(req.body).save();
    res.json("Thank you for registering. You can login!");
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
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
        if (!user) throw createError("Account is not registered");
        if (!req.body.password) throw createError("Your password is required");
        if (!(await bcrypt.compare(req.body.password, user.password || "")))
          throw createError("Invalid credentials");
        break;
    }
    user = await User.findByIdAndUpdate(
      { _id: user.id },
      {
        isLogin: true
      },
      { new: true }
    );
    await setTokens(res, user.id, req.query.rememberMe);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const signout = async (req, res, next) => {
  try {
    setTokens(res);
    res.json("You just got signed out");
    const user = await User.findByIdAndUpdate(req.user.id, {
      isLogin: false
    });
    if (user)
      await User.updateOne(
        {
          _id: req.user.id
        },
        {
          settings: {
            ...user.settings,
            ...req.body.settings
          }
        }
      );
  } catch (err) {
    next(err);
  }
};

export const userExist = async (req, res, next) => {
  try {
    return res.json(
      !!(await User.findOne(
        {
          placeholder: {
            $or: [
              { email: req.body.placeholder || req.body.email },
              { username: req.body.placeholder || req.body.username }
            ]
          },
          email: {
            email: req.body.email
          },
          username: {
            username: req.body.username
          }
        }[(req.query.relevance || "placeholder").toLowerCase()]
      ))
    );
  } catch (err) {
    next(err);
  }
};

export const refreshTokens = async (req, res, next) => {
  try {
    verifyToken(req, {
      applyRefresh: true
    });
    if (req.user)
      await setTokens(
        res,
        req.user.id,
        req.cookies.refresh_token.rememberMe,
        true
      );
    else throw createError(`Forbidden access`, 403);
    res.json("Token refreshed");
  } catch (err) {
    next(createError(err.message, 403));
  }
};

export const recoverPwd = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      email
    });
    if (!user) throw createError("Account isn't registered", 400);
    const token = generateToken();
    user.resetToken = token;
    const date = new Date();
    date.setHours(Number(req.query.timeHr) || 1);
    user.resetDate = date;
    await user.save();
    sendMail(
      {
        to: email,
        from: GMAIL_USER,
        subject: "Mern-social account password Reset",
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.origin}/auth/reset-password/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      },
      err => {
        if (err) {
          return next(err);
        } else {
          return res.json(
            "An email has been sent to you with further instruction"
          );
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

export const verifyUserToken = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetToken: req.body.token
    });
    if (!user) return res.json("Invalid token");
    const start = new Date();
    start.setHours(start.getHours() - (Number(req.query.timeHr) || 1));
    const resetDate = new Date(user.resetDate);
    if (!(resetDate.getTime() >= start.getTime()))
      throw createError("Token expired");

    const expires = new Date();
    expires.setMinutes(30);
    res.cookie("reset-pwd-token", req.body.token, {
      httpOnly: true,
      expires
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const resetPwd = async (req, res, next) => {
  try {
    const token = req.cookies["reset-pwd-token"];
    if (!token) throw createError("Forbidden access", 403);
    const user = await User.findOne({
      token,
      email: req.body.email
    });
    if (!user) throw createError(`User don't exist`);
    if (user.provider)
      throw createError(
        `Failed to reset password. Account is registered under a third party provider`
      );
    await user.updateOne({
      password: await bcrypt.hash(req.body.password, await bcrypt.genSalt()),
      resetDate: null,
      resetToken: null
    });
    res.clearCookie("reset-pwd-token");
    res.json("Password reset successful");
  } catch (err) {
    next(err);
  }
};
