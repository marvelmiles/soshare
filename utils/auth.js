import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { setFutureDate } from "./index.js";
import { cookieConfig } from "../constants.js";

export const generateToken = () => crypto.randomBytes(20).toString("hex");

export const hashToken = async (token, rounds = 10) =>
  await bcrypt.hash(token, await bcrypt.genSalt(rounds));

export const deleteCookie = (name, res) => {
  const expires = new Date();
  expires.setFullYear(1990);
  res.cookie(name, "", { ...cookieConfig, expires });
};

export const setJWTCookie = (name, uid, res, time = {}, withExtend) => {
  let { duration = 1, extend, type = "h" } = time;
  duration = withExtend ? extend : duration;

  let expires = new Date();

  switch (type) {
    case "h":
      expires.setHours(expires.getHours() + duration);
      break;
    case "d":
      expires = setFutureDate(duration);
      break;
    case "m":
      expires.setMinutes(expires.getMinutes() + duration);
      break;
  }

  res.cookie(
    name,
    jwt.sign({ id: uid }, process.env.JWT_SECRET, {
      expiresIn: duration + type
    }),
    {
      ...cookieConfig,
      expires
    }
  );
};
