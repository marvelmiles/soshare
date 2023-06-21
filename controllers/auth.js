import User from "../models/User.js";
import { createError } from "../utils/error.js";
import bcrypt from "bcrypt";
import { setTokens, generateToken, hashToken } from "../utils/index.js";
import { isEmail } from "../utils/validators.js";
import { sendMail } from "../utils/file-handlers.js";
import { verifyToken } from "../utils/middlewares.js";
import { TOKEN_EXPIRED_MSG, PWD_RESET_COOKIE_KEY } from "../config.js";
import jwt from "jsonwebtoken";

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
        if (!user) user = await new User(req.body).save();
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

export const userExists = async (req, res, next) => {
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
    user.resetToken = await hashToken(token);
    const date = new Date();
    date.setHours(date.getHours() + (Number(req.query.timeHr) || 1));
    user.resetDate = date;
    await user.save();
    sendMail(
      {
        to: email,
        from: "noreply@gmail.com",
        subject: "Mern-social account password Reset",
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.origin}/auth/reset-password/${token}/${user.id}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      },
      err => {
        if (err) {
          return next(err);
        } else {
          return res.json("An email has been sent to you");
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
      resetToken: req.params.token,
      resetDate: { $gt: Date.now() }
    });
    if (!user) return res.json(TOKEN_EXPIRED_MSG);
    res.cookie(
      PWD_RESET_COOKIE_KEY,
      jwt.sign(
        {
          id: user.id
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      ),
      {
        httpOnly: true
      }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const resetPwd = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId,
      resetDate: { $gt: Date.now() }
    });

    if (!user) throw createError(TOKEN_EXPIRED_MSG);

    if (user.provider)
      throw createError(
        `Failed to reset password. Account is registered under a third party provider`
      );

    if (!(await bcrypt.compare(req.params.token, user.resetToken)))
      throw createError("Authorization credentials is invalid");

    await user.updateOne({
      password: await bcrypt.hash(req.body.password, await bcrypt.genSalt()),
      resetDate: null,
      resetToken: null
    });

    res.json("Password reset successful");
  } catch (err) {
    next(err);
  }
};
