import Short from "../models/Short.js";
import { createError } from "../utils/error.js";
import { deleteFile } from "../utils/file-handlers.js";
import {
  likeMedia,
  dislikeMedia,
  getFeedMedias,
  deleteDocument
} from "../utils/req-res-hooks.js";
import User from "../models/User.js";

export const createShort = async (req, res, next) => {
  try {
    if (!req.file) throw createError("Invalid request expect a video file");
    req.body.user = req.user.id;
    req.body.url = req.file.publicUrl;
    req.body.mimetype = req.file.mimetype;
    let short = await new Short(req.body).save();
    const user = await User.findByIdAndUpdate(
      short.user,
      {
        $inc: {
          shortCount: 1
        }
      },
      { new: true }
    );
    short.user = user;
    res.json(short);
    const io = req.app.get("socketIo");
    if (io) {
      short.visibility !== "private" && io.emit("short", short);
      io.emit("update-user", short.user);
    }
  } catch (err) {
    next(err);
  }
};

export const getFeedShorts = async (req, res, next) => {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  return getFeedMedias({
    model: Short,
    req,
    res,
    next,
    match: {
      createdAt: {
        $gte: start
      }
    }
  });
};

export const getShort = async (req, res, next) => {
  try {
    const short = await Short.findById(req.params.id).populate("user");
    res.json(short);
  } catch (err) {
    next(err);
  }
};

export const updateShort = async (req, res, next) => {
  try {
    const fmrUrl = req.file ? (await Short.findById(req.params.id)).url : "";
    if (req.file && fmrUrl) deleteFile(fmrUrl);
    res.json(
      await Short.findByIdAndUpdate(
        req.params.id,
        {
          visibility: req.body.visibility,
          url: req.file?.publicUrl,
          mimetype: req.file?.mimetype
        },
        { new: true }
      )
    );
  } catch (err) {
    next(err);
  }
};

export const likeShort = async (req, res, next) =>
  likeMedia(Short, req, res, next);

export const dislikeShort = async (req, res, next) =>
  dislikeMedia(Short, req, res, next);

export const blacklistShort = async (req, res, next) => {
  try {
    await User.updateOne(
      {
        _id: req.user.id
      },
      {
        $addToSet: {
          shortBlacklist: req.params.id
        }
      }
    );
    res.json("Blacklisted successfully");
  } catch (err) {
    next(err);
  }
};

export const incrementShortViews = async (req, res, next) => {
  try {
    const views = (await Short.findById(req.params.id)).views;
    views.set(req.user.id, true);
    await Short.updateOne(
      {
        _id: req.params.id
      },
      {
        views
      }
    );
    res.json(views);
  } catch (err) {
    next(err);
  }
};

export const deleteShort = async (req, res, next) =>
  deleteDocument({ req, res, next, model: Short });
