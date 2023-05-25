import { createVisibilityQuery, mergeThread } from "./serializers.js";
import { verifyToken } from "../utils/middlewares.js";
import {
  getAll,
  sendAndUpdateNotification,
  handleMiscDelete
} from "./index.js";
import { createError } from "./error.js";
import User from "../models/User.js";
import { deleteFile } from "./file-handlers.js";
import { isObjectId } from "./validators.js";
export const getFeedMedias = async ({
  req,
  res,
  next,
  model,
  match,
  withFallbackVisibility,
  dataKey,
  populate,
  ...rest
}) => {
  try {
    req.query.randomize = req.query.randomize || "true";
    req.query.randomize = "false";
    if (req.cookies?.access_token) verifyToken(req);
    if (!match && req.params.documentId) {
      match = {
        document: req.params.documentId
      };
    }
    const result = await getAll({
      model,
      populate,
      dataKey,
      match: await createVisibilityQuery({
        query: match,
        userId: req.user?.id,
        withFallbackVisibility:
          withFallbackVisibility || model.modelName !== "user"
      }),
      query: req.query,
      userId: req.user?.id,
      ...rest
    });
    if (req.query.withThread === "true") {
      let i = 0;
      if (req.query.ro || req.query.threadPriorities) {
        for (let doc of result.data.slice(
          req.query.threadSkip || 0,
          req.query.threadLimit || Number(req.query.limit) || 20
        )) {
          result.data[i] = await mergeThread(model, doc, req.query, populate);
          i++;
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
    const media = await model.findById(req.params.id);
    if (media.likes.get(req.user.id))
      return next(
        createError(
          `${model.collection.collectionName} already liked by you`,
          200
        )
      );
    media.likes.set(req.user.id, true);
    res.json(
      (await model.findByIdAndUpdate(
        req.params.id,
        {
          likes: media.likes
        },
        { new: true }
      )).likes
    );

    await sendAndUpdateNotification({
      req,
      type: "like",
      docType: model.modelName,
      document: media,
      eventName: `update-${model.modelName}`,
      docPopulate: [
        {
          path: "user document"
        }
      ],
      reportIds: {
        like: media.likes,
        comment: media.comments,
        user: [media.user]
      }
    });
  } catch (err) {
    next(err);
  }
};

export const dislikeMedia = async (model, req, res, next) => {
  try {
    const media = await model.findById(req.params.id);
    if (media.likes.get(req.user.id)) media.likes.delete(req.user.id);
    res.json(
      (await model.findByIdAndUpdate(
        req.params.id,
        {
          likes: media.likes
        },
        { new: true }
      )).likes
    );

    await sendAndUpdateNotification({
      req,
      filter: true,
      type: "like",
      docType: model.modelName,
      document: media,
      eventName: `update-${model.modelName}`,
      docPopulate: [
        {
          path: "user document"
        }
      ]
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
  withFallbackVisibility
}) => {
  try {
    if (!isObjectId(req.params.id))
      throw createError(`${model.modelName} not found`, 404);
    if (req.cookies.access_token) verifyToken(req);
    let list = [];
    if (req.usr) {
      list = (await User.findById(req.user.id)).recommendationBlacklist;
    }
    const query = await createVisibilityQuery({
      withFallbackVisibility:
        withFallbackVisibility || model.modelName !== "user",
      userId: req.user?.id,
      searchUser: req.params.id,
      query: {
        _id: req.params.id
      },
      withBlacklist: false
    });

    const doc = await model.findOne(query);
    if (!doc) throw createError(`${model.modelName} not found`, 404);
    if (list.includes(doc.user)) throw createError(`owner blacklisted`, 400);
    res.json(await doc.populate(populate));
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async ({ req, res, next, model }) => {
  try {
    const doc = await model.findById(req.params.id);
    if (!doc) throw createError(`${model.modelName} not found`);
    if (doc.user !== req.user.id)
      throw createError("Delete operation denied", 401);
    await model.deleteOne({
      _id: req.params.id
    });
    res.json(`Successfully deleted ${model.modelName}`);
    const io = req.app.get("socketIo");
    if (doc.user && model.modelName !== "comment") {
      const user = await User.findByIdAndUpdate(doc.user, {
        $inc: {
          [`${model.modelName}Count`]: -1
        }
      });
      if (io) {
        io.emit(`filter-${model.modelName}`, doc.id);
        io.emit("update-user", user);
      }
    }
    handleMiscDelete(doc.id, io, model.modelName !== "short");
    if (doc.medias) {
      for (let { url } of doc.medias) {
        deleteFile(url);
      }
    } else if (doc.url) deleteFile(doc.url);
  } catch (err) {
    next(err);
  }
};
