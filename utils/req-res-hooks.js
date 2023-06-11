import { createVisibilityQuery } from "./serializers.js";
import { verifyToken } from "../utils/middlewares.js";
import {
  getAll,
  sendAndUpdateNotification,
  handleMiscDelete,
  getThreadsByRelevance
} from "./index.js";
import { createError } from "./error.js";
import User from "../models/User.js";
import { deleteFile } from "./file-handlers.js";
import { isObjectId } from "./validators.js";
import { Types } from "mongoose";
export const getFeedMedias = async ({
  req,
  res,
  next,
  model,
  match,
  dataKey,
  populate,
  verify,
  refPath,
  isVisiting,
  ...rest
}) => {
  try {
    req.query.randomize = req.query.randomize || "true";

    if (req.cookies?.access_token) verifyToken(req);

    if (!match && req.params.documentId) {
      match = {
        document: req.params.documentId
      };
    }
    dataKey && refPath === undefined && (refPath = "_id");
    verify &&
      console.log(
        req.params.id,
        req.user?.id,
        req.params.userId,
        " REQ-RES-ID "
      );
    match = await createVisibilityQuery({
      refPath,
      isVisiting,
      query: match,
      userId: req.params.userId,
      searchUser: req.user ? req.user.id : "",
      verify
    });

    // const result = {
    //   data: [],
    //   paging: {
    //     nextCursor: null
    //   }
    // };

    const result = await getAll({
      model,
      populate,
      dataKey,
      match,
      query: req.query,
      userId: req.user?.id,
      verify,
      ...rest
    });

    if (req.query.withThread === "true") {
      if (req.query.ro || req.query.threadPriorities) {
        for (let i = 0; i < result.data.length; i++) {
          result.data[i].threads = await getThreadsByRelevance(
            result.data[i].id,
            req.query,
            model
          );
        }
      }
    }

    res.json(result);
  } catch (err) {
    // console.log(err.message, " feed medias ");
    next(err);
  }
};

export const likeMedia = async (model, req, res, next) => {
  try {
    const media = await model.findByIdAndUpdate(
      req.params.id,
      {
        [`likes.${req.user.id}`]: true
      },
      { new: true }
    );

    const io = req.app.get("socketIo");
    if (io) io.emit(`update-${model.modelName}`, media);
    res.json(media.likes);

    await sendAndUpdateNotification({
      req,
      type: "like",
      docType: model.modelName,
      document: media
    });
  } catch (err) {
    next(err);
  }
};

export const dislikeMedia = async (model, req, res, next) => {
  try {
    const media = await model.findByIdAndUpdate(
      req.params.id,
      {
        [`likes.${req.user.id}`]: false
      },
      { new: true }
    );
    const io = req.app.get("socketIo");
    if (io) io.emit(`update-${model.modelName}`, media);
    res.json(media.likes);
    await sendAndUpdateNotification({
      req,
      filter: true,
      type: "like",
      docType: model.modelName,
      document: media
    });
  } catch (err) {
    next(err);
  }
};

export const getDocument = async ({
  req,
  res,
  next,
  model,
  populate = [
    {
      path: "user"
    }
  ],
  verify
}) => {
  try {
    // verify &&
    //   console.log(
    //     "getting doc ",
    //     model.modelName,
    //     req.params.id,
    //     req.params.userId
    //   );
    const _id = req.params.id || req.params.userId;

    if (req.cookies.access_token) verifyToken(req);
    let list = [];
    if (req.user) {
      list = (await User.findById(req.user.id)).recommendationBlacklist;
    }
    const query = await createVisibilityQuery({
      userId: req.user?.id,
      searchUser: req.params.userId,
      query: {
        _id
      },
      allowDefaultCase: true,
      withBlacklist: false
    });

    let doc = await model.findOne(query);
    if (!doc) throw createError(`${model.modelName} not found`, 404);
    if (list.includes(doc.user)) throw createError(`owner blacklisted`, 400);
    doc = await doc.populate(populate);

    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async ({
  req,
  res,
  next,
  model,
  withCount = true
}) => {
  try {
    // console.log(req.query);
    const doc = await model.findById(req.params.id);
    if (!doc) return res.json(`Successfully deleted ${model.modelName}`);
    if (doc.user !== req.user.id)
      throw createError("Delete operation denied", 401);
    // await model.deleteOne({
    //   _id: req.params.id
    // });

    setTimeout(() => {
      res.json(`Successfully deleted ${model.modelName}`);
      (async () => {
        const user = await User.findByIdAndUpdate(
          {
            _id: doc.user
          },
          withCount
            ? {
                $inc: { [`${model.modelName}Count`]: -1 }
              }
            : {},
          { new: true }
        );
        const io = req.app.get("socketIo");
        if (io) {
          doc.user = user;
          io.emit(`filter-${model.modelName}`, doc);
          doc.user && io.emit("update-user", user);
        }
        handleMiscDelete(doc.id, io, model.modelName !== "short");
        if (doc.medias) {
          for (let { url } of doc.medias) {
            deleteFile(url);
          }
        } else if (doc.url) deleteFile(doc.url);
      })();
    }, 10000);
  } catch (err) {
    console.log(err.message, " err ");
    next(err);
  }
};
