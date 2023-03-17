import jwt from "jsonwebtoken";
import { verifyToken } from "../controllers/auth.js";
import { createError } from "./error.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { ObjectId } from "bson";
import Post from "../models/Post.js";

export const setTokens = async (res, id, rememberMe) => {
  console.log("remeber me ", rememberMe);
  rememberMe = rememberMe === "true";
  const shortT = new Date();
  shortT.setMinutes(shortT.getMinutes() + 30);
  const longT = new Date();
  if (rememberMe) longT.setDate(longT.getDate() + 28);
  else longT.setHours(longT.getHours() + 6);
  res
    .cookie(
      "access_token",
      jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30m"
      }),
      {
        httpOnly: true,
        expires: shortT
      }
    )
    .cookie(
      "refresh_token",
      {
        jwt: jwt.sign({ id }, process.env.JWT_SECRET, {
          expiresIn: rememberMe ? "28d" : "6h"
        }),
        rememberMe
      },
      {
        httpOnly: true,
        expires: longT
      }
    );
};

const encrypt = str => {
  return str;
};

const decrypt = enc => {
  return enc;
};

// Rm duplicate: group by _id and project a new root of the first document
// only which will verify no document is returned twice.
export const getAll = async ({
  query = {},
  model,
  match,
  populate,
  sort = {},
  asc = false,
  dataKey
}) => {
  let { limit = 0, cursor, query_op } = query;
  limit = Number(limit) || 20;
  if (cursor) cursor = decodeURIComponent(cursor);

  let result;
  if (dataKey) {
    cursor = cursor || 0;
    result = (await (await model.findOne(match)).populate(dataKey))[dataKey];
    result = result.slice(cursor, cursor + limit);
    cursor = cursor + result.length;
    cursor = cursor < result.length ? cursor : null;
    if (!asc) {
      result.sort(function(a, b) {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    }
  } else {
    limit = limit + 1;
    if (asc) sort._id = 1;
    else sort._id = -1;
    if (cursor) {
      match = {
        ...match,
        $expr: {
          [asc ? "$gte" : "$lte"]: ["$_id", new ObjectId(cursor)]
        }
      };
    }

    // if (query_op) {
    //   switch (query_op.toLowerCase()) {
    //     case "relevant":
    //       console.log("limit", limit);
    //       match = {
    //         ...match,
    //         user: userId
    //       };
    //       break;
    //   }
    // }
    result = await model.aggregate([
      {
        $match: match
      },
      { $sort: sort },
      {
        $limit: limit
      },
      {
        $addFields: {
          id: "$_id"
        }
      },
      {
        $unset: ["_id"]
      }
    ]);

    if (populate) result = await model.populate(result, populate);
    cursor = null;
    if (result.length === limit) {
      cursor = result[limit - 1].id;
      result.pop();
    }
  }
  // model.modelName === "comment" && console.log(result, " result..");
  // (query.shuffle || "true") === "true" && shuffleArray(result);
  // model.modelName === "comment" && console.log(match);
  return new Promise((re, rj) => {
    setTimeout(() => {
      re({
        data: result,
        paging: {
          nextCursor: cursor ? encodeURIComponent(cursor) : null
        }
      });
    }, 10000);
  });
};

/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray(array, modify = true) {
  !modify && (array = array.slice());
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export const createVisibilityQuery = async (
  userId,
  searchRef,
  expires,
  query
) => {
  if (query) {
    query.$or = [
      {
        visibility: "everyone"
      },
      ...(query.$or ? query.$or : [])
    ];
  } else
    query = {
      $or: [
        {
          visibility: "everyone"
        }
      ]
    };

  if (expires) query.$or[0].createdAt = expires;
  if (userId) {
    // console.log(userId, "create visibility  user id");
    const user = await User.findById(userId);
    if (!user) throw createError("User doesn't exist", 404);

    query.$or.push({
      user: { $in: user.following }
    });
    query.user = {
      $nin: user.recommendationBlacklist
    };
    query.$or.push({
      user: userId
    });
  }
  if (searchRef) {
    query.$or.push({
      _id: searchRef
    });
  }
  return query;
};

export const getFeedMedias = async ({
  req,
  res,
  next,
  model,
  populate,
  match,
  expireAt,
  validateDoc,
  ...rest
}) => {
  try {
    verifyToken(req, {
      _noNext: true
    });
    let isOwner;
    if (req.user && validateDoc) {
      isOwner =
        (await {
          post: Post
        }[validateDoc].findById(match.document)).user === req.user.id;
    }
    const q = isOwner
      ? match
      : await createVisibilityQuery(
          req.user?.id,
          req.query.searchRef,
          expireAt,
          match
        );
    // expireAt && console.log(q, model.modelName);
    const t = await getAll({
      model,
      match: q,
      query: req.query,
      populate: populate || {
        path: "user"
        // select: req.query.user_select
      },
      userId: req.user?.id,
      ...rest
    });
    // console.log(t.data.length, isOwner, validateDoc, req.user?.id, q);
    return res.json(t);
  } catch (err) {
    next(createError(err.message, 404));
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
    sendAndUpdateNotification({
      req,
      type: "like",
      docType: model.modelName,
      document: media.id,
      reportIds: {
        like: media.likes,
        comment: media.comments,
        user: [media.user]
      },
      docPopulate: [
        {
          path: "user"
        }
      ]
    });
  } catch (err) {
    next(createError(err.message, 409));
  }
};

export const sendAndUpdateNotification = async ({
  req,
  document,
  type,
  docType,
  filter = false,
  to,
  eventName,
  toAll = {
    follow: false
  }[type],
  foreignKey,
  docPopulate,
  saveAlways,
  reportIds,
  reportFrom
}) => {
  toAll = toAll === undefined ? true : toAll;
  reportFrom =
    {
      follow: true
    }[type] || false;
  to =
    to === undefined
      ? toAll
        ? undefined
        : document
        ? document.user
          ? document.user.id || document.user
          : document
        : req.params.userId
      : to;

  eventName =
    eventName ||
    {
      follow: filter ? "unfollow" : "follow",
      like: filter ? "dislike" : "like"
    }[type] ||
    type;
  if (document) {
    foreignKey =
      foreignKey ||
      (document &&
        (document.foreignKey ||
          ((document.document && (document.document.id || document.document)) ||
            document.id ||
            document)));
    docType = docType || type;
  }
  let match;
  if (foreignKey) {
    match = {
      type,
      to,
      foreignKey
    };
  } else if (document)
    match = {
      type,
      document: document.id || document,
      to
    };
  else {
    match = {
      type,
      to,
      from: req.user.id
    };
  }
  const populate = [
    {
      path: "from to"
    },
    {
      path: "document",
      populate: docPopulate
    }
  ];
  let notice, report;
  if (filter) {
    if (reportFrom)
      notice = await Notification.findOneAndUpdate(match, {
        [`reports.${req.user.id}.expireAt`]: new Date(
          new Date().valueOf() + 86400000
        )
      }).populate(populate);
  } else {
    match.from = req.user.id;
    if (
      saveAlways ||
      ((notice = await Notification.findOne(match))
        ? !(report = notice.reports.get(req.user.id)) ||
          (report.expireAt &&
            new Date(report.expireAt).valueOf() < new Date().valueOf())
        : true)
    ) {
      if (notice) {
        await Notification.deleteOne(match);
        if (document || foreignKey) delete match.from;
      }
      const reportProp = {
        type,
        marked: false,
        expireAt: null
      };
      const prop = {
        type,
        foreignKey,
        to,
        from: req.user.id,
        docType,
        document: document && (document.id || document),
        reports: reportFrom
          ? {
              [req.user.id]: reportProp
            }
          : {}
      };

      if (reportIds)
        for (const type in reportIds) {
          for (const id of reportIds[type].length === undefined
            ? reportIds[type].toBSON().keys()
            : reportIds[type]) {
            if (id === req.user.id) continue;
            reportProp.type = type;
            prop.reports[id] = reportProp;
          }
        }

      toAll &&
        (await Notification.updateMany(match, {
          [`reports.${req.user.id}`]: reportProp
        }));

      notice = await (await new Notification(prop).save()).populate(populate);
    } else if (notice) notice = await notice.populate(populate);
  }
  const io = req.app.get("socketIo");
  if (io && notice)
    if (toAll) {
      !report && io.emit("notification", notice, filter);
      io.emit(eventName, notice, filter);
    } else {
      !report && io.to(notice.to.id).emit("notification", notice, filter);
      io.to(notice.to.id).emit(eventName, notice, filter);
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

    sendAndUpdateNotification({
      req,
      type: "like",
      filter: true,
      document: media.id,
      docPopulate: [
        {
          path: "user"
        }
      ]
    });
  } catch (err) {
    next(err);
  }
};

export const removeFirstItemFromArray = (item, array) => {
  for (let i = 0; i < array.length; i++) {
    if (item === array[i]) {
      array.splice(i, 1);
      break;
    }
    continue;
  }
  return array;
};
