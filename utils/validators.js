import mongoose from "mongoose";

export const isObject = obj =>
  obj &&
  (typeof obj.toString === "function"
    ? obj.toString() === "[object Object]"
    : typeof obj === "object" && obj !== null && obj.length === undefined);
export const isEmail = str => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
    str
  );
};

export const isObjectId = str => mongoose.isValidObjectId(str);
