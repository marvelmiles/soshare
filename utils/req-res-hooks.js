import { createVisibilityQuery } from "./serializers.js";
import { verifyToken } from "../utils/middlewares.js";
import {
  getAll,
  sendAndUpdateNotification,
  handleMiscDelete,
  getThreadsByRelevance,
  createDemoDocAndComment
} from "./index.js";
import { createError, console500MSG } from "./error.js";
import User from "../models/User.js";
import { deleteFile } from "./file-handlers.js";
import { isObjectId } from "./validators.js";
import {
  HTTP_CODE_USER_BLACKLISTED,
  HTTP_CODE_DOCUMENT_NOT_FOUND,
  INVALID_DEMO_DOC_CREATION
} from "../constants.js";

export const getFeedMedias = async ({
  req,
  res,
  next,
  model,
  match,
  dataKey,
  populate,
  refPath,
  verify,
  ...rest
}) => {
  try {
    // console.log(!!req.cookies.access_token, " with access_token..res-res-hook");

    if (req.cookies.access_token) verifyToken(req);

    if (!match && req.params.documentId) {
      match = {
        document: req.params.documentId
      };
    }

    dataKey && refPath === undefined && (refPath = "_id");

    if (
      req.query.withVisibilityQuery
        ? req.query.withVisibilityQuery === "true"
        : true
    )
      match = await createVisibilityQuery({
        refPath,
        query: match,
        searchUserId: req.params.userId,
        userId: req.user?.id
      });

    const result = await getAll({
      model,
      populate,
      dataKey,
      match,
      query: req.query,
      userId: req.user?.id,
      ...rest
    });

    if (req.query.withThread === "true") {
      if (req.query.ro || req.query.threadPriorities) {
        for (let i = 0; i < result.data.length; i++) {
          result.data[i].threads = await getThreadsByRelevance(
            result.data[i].id,
            req.query,
            model,
            match.$expr
          );
        }
      }
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const likeMedia = async (model, req, res, next) => {
  try {
    const media = await model
      .findByIdAndUpdate(
        req.params.id,
        {
          [`likes.${req.user.id}`]: true
        },
        { new: true }
      )
      .populate("user");

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
    const likes = (await model.findById(req.params.id))?.likes;
    if (!likes) return res.json({});
    likes.delete(req.user.id);
    const media = await model
      .findByIdAndUpdate(
        req.params.id,
        {
          likes
        },
        { new: true }
      )
      .populate("user");
    const io = req.app.get("socketIo");
    if (io && media) io.emit(`update-${model.modelName}`, media);
    res.json(likes);
    sendAndUpdateNotification({
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
    },
    {
      path: "document",
      populate: "user"
    }
  ]
}) => {
  try {
    const _id = req.params.id || req.params.userId;

    const msg404 = `${model.modelName} not found`;

    if (!isObjectId(_id))
      throw createError(msg404, 404, HTTP_CODE_DOCUMENT_NOT_FOUND);

    if (req.cookies.access_token) verifyToken(req);

    let blacklist = [];

    if (req.user) {
      const { blockedUsers = [] } = (await User.findById(req.user.id)) || {};
      blacklist = blockedUsers;
    }

    let query = {
      _id
    };

    if (
      req.query.withVisibilityQuery
        ? req.query.withVisibilityQuery === "true"
        : true
    )
      query = await createVisibilityQuery({
        userId: req.user?.id,
        searchUserId: req.params.userId,
        query,
        allowDefaultCase: true,
        withBlacklist: false
      });

    let doc = await model.findOne(query);

    if (!doc) throw createError(msg404, 404, HTTP_CODE_DOCUMENT_NOT_FOUND);

    if (blacklist.includes(doc.user || doc.id))
      throw createError(`owner blacklisted`, 400, HTTP_CODE_USER_BLACKLISTED);

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
    const doc = await model.findById(req.params.id);

    if (!doc) return res.json(`Successfully deleted ${model.modelName}`);
    if (doc.user !== req.user.id)
      throw createError("Delete operation denied", 401);

    await model.deleteOne({
      _id: req.params.id
    });

    res.json(`Successfully deleted ${model.modelName}`);

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

    handleMiscDelete(doc.id, io, {
      withComment: model.modelName !== "short"
    });

    if (!doc.isDemo)
      if (doc.medias) {
        for (let { url } of doc.medias) {
          deleteFile(url);
        }
      } else if (doc.url) deleteFile(doc.url);

    (model.modelName === "post" || model.modelName === "short") &&
      createDemoDocAndComment(
        req.user.id,
        model.modelName === "short",
        req.app
      ).catch(err => console500MSG(err, INVALID_DEMO_DOC_CREATION));
  } catch (err) {
    next(err);
  }
};
