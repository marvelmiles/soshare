import User from "../models/User.js";
import { createError, console500MSG } from "../utils/error.js";
import bcrypt from "bcrypt";
import {
  setJWTCookie,
  generateToken,
  hashToken,
  deleteCookie
} from "../utils/auth.js";
import { isEmail, isObjectId } from "../utils/validators.js";
import { sendMail } from "../utils/file-handlers.js";
import { verifyToken } from "../utils/middlewares.js";
import { TOKEN_EXPIRED_MSG, PWD_RESET_COOKIE_KEY } from "../config.js";
import { createSuccessBody } from "../utils/normalizers.js";
import {
  HTTP_CODE_INVALID_USER_ACCOUNT,
  CLIENT_ORIGIN,
  SESSION_COOKIE_DURATION,
  COOKIE_KEY_ACCESS_TOKEN,
  COOKIE_KEY_REFRESH_TOKEN,
  HTTP_MSG_INVALID_ACC_CRED,
  HTTP_MSG_USER_EXISTS
} from "../constants.js";
import fs from "fs";
import path from "path";
import ejs from "ejs";

// (async () => {
//   await User.findOneAndUpdate(
//     { email: "marvellousoluwaseun2@gmail.com" },
//     {
//       password: await bcrypt.hash("@testUser1", await bcrypt.genSalt())
//     }
//   );
// })();

export const signup = async (req, res, next) => {
  try {
    if (!isEmail(req.body.email))
      throw createError(
        "Account email address is invalid",
        400,
        HTTP_CODE_INVALID_USER_ACCOUNT
      );

    let user = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }]
    });

    if (user)
      throw createError(
        HTTP_MSG_USER_EXISTS,
        400,
        HTTP_CODE_INVALID_USER_ACCOUNT
      );

    if (!req.body.password || req.body.password.length < 8)
      throw createError("A minimum of 8 character password is required");
    req.body.password = await bcrypt.hash(
      req.body.password,
      await bcrypt.genSalt()
    );

    req.body.photoUrl = req.file?.publicUrl;
    user = await new User(req.body).save();

    const io = req.app.get("socketIo");

    io && io.emit("user", user);

    res.json(
      createSuccessBody({
        message: "Thank you for registering. You can login!"
      })
    );
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
    console.log(req.body, " req body... ");

    const query = {
      $or: [
        { email: req.body.placeholder || req.body.email },
        {
          username: req.body.placeholder || req.body.username
        }
      ]
    };

    let user = await User.findOne(query);

    const provider = req.body.provider && req.body.provider.toLowerCase();

    let updateUser = false;

    switch (provider) {
      case "google":
        if (user) {
          if (provider !== user.provider)
            throw createError(
              `Sorry only one account can use the email address ${req.body.email}.`
            );

          updateUser = true;
        } else user = await new User(req.body).save();
        break;
      default:
        if (!user)
          throw createError(
            "Account is not registered with us!",
            400,
            HTTP_CODE_INVALID_USER_ACCOUNT
          );

        if (user.provider) throw HTTP_MSG_INVALID_ACC_CRED;

        if (!req.body.password) throw "Your password is required";

        if (!(await bcrypt.compare(req.body.password, user.password || "")))
          throw HTTP_MSG_INVALID_ACC_CRED;
        break;
    }

    user = await User.findByIdAndUpdate(
      { _id: user.id },
      {
        isLogin: true,
        ...(updateUser ? user : undefined)
      },
      { new: true }
    );

    setJWTCookie(
      COOKIE_KEY_ACCESS_TOKEN,
      user.id,
      res,
      SESSION_COOKIE_DURATION.accessToken
    );

    setJWTCookie(
      COOKIE_KEY_REFRESH_TOKEN,
      user.id,
      res,
      SESSION_COOKIE_DURATION.refreshToken,
      req.query.rememberMe
    );

    res.json(createSuccessBody({ data: user }));
  } catch (err) {
    next(err);
  }
};

export const signout = async (req, res, next) => {
  try {
    console.log(
      "signing out",
      req.body,
      !!req.cookies[COOKIE_KEY_ACCESS_TOKEN],
      " body.access_token.signed out..."
    );

    deleteCookie(COOKIE_KEY_ACCESS_TOKEN, res);
    deleteCookie(COOKIE_KEY_REFRESH_TOKEN, res);

    res.json(createSuccessBody({ message: "You just got signed out!" }));

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

    console.log("refreshing tokee");

    if (req.user)
      setJWTCookie(
        COOKIE_KEY_ACCESS_TOKEN,
        req.user.id,
        res,
        SESSION_COOKIE_DURATION.accessToken
      );
    else throw createError(`Forbidden access`, 403);
    res.json(createSuccessBody({ message: "Token refreshed" }));
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

    if (user.provider) throw HTTP_MSG_INVALID_ACC_CRED;

    if (!user)
      throw createError(
        "Account isn't registered",
        400,
        HTTP_CODE_INVALID_USER_ACCOUNT
      );

    const token = generateToken();
    user.resetToken = await hashToken(token);

    await user.save();

    const template = fs.readFileSync(
      path.resolve(process.cwd(), "templates/pwdResetTemplate.ejs"),
      "utf-8"
    );

    const props = {
      token,
      fullname: user.displayName || user.username,
      primaryColor: "#2196f3",
      secondaryColor: "#1769aa",
      verifyLink: `${CLIENT_ORIGIN}/auth/reset-password/${token}/${user.id}`
    };

    sendMail(
      {
        to: email,
        from: "noreply@gmail.com",
        subject: "Soshare account password Reset",
        html: ejs.render(template, props)
      },
      err => {
        (async () => {
          if (err) {
            return next(err);
          } else {
            try {
              const date = new Date();

              date.setMinutes(
                date.getMinutes() + (Number(req.query.mins) || 15)
              );

              user.resetDate = date;

              await user.updateOne({
                resetDate: date
              });

              return res.json(
                createSuccessBody({
                  message: "We've sent you an email with further instructions!"
                })
              );
            } catch (err) {
              console500MSG(err);
            }
          }
        })();
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
    if (!user)
      return res.json(createSuccessBody({ message: TOKEN_EXPIRED_MSG }));

    setJWTCookie(
      PWD_RESET_COOKIE_KEY,
      user.id,
      res,
      SESSION_COOKIE_DURATION.accessToken
    );

    res.json(createSuccessBody({ data: user }));
  } catch (err) {
    next(err);
  }
};

export const resetPwd = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.userId)) throw "Invalid request";

    const user = await User.findOne({
      _id: req.params.userId,
      resetDate: { $gt: Date.now() }
    });

    if (!user) throw createError(TOKEN_EXPIRED_MSG);

    if (user.provider)
      throw createError(
        `Failed to reset password. ${HTTP_MSG_INVALID_ACC_CRED}`
      );

    if (!(await bcrypt.compare(req.params.token, user.resetToken)))
      throw createError("Authorization credentials is invalid");

    await user.updateOne({
      password: await bcrypt.hash(req.body.password, await bcrypt.genSalt()),
      resetDate: null,
      resetToken: null
    });

    res.json(createSuccessBody({ message: "Password reset successful" }));
  } catch (err) {
    next(err);
  }
};
