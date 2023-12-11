import Notification from "../models/Notification.js";
import { isObject } from "./validators.js";
import Comment from "../models/Comment.js";
import { console500MSG } from "./error.js";
import { isProdMode } from "../constants.js";
import Post from "../models/Post";
import { shuffleArray } from "./normalizers.js";
import { demoPost, demoUsers } from "../data.js";
import User from "../models/User.js";
import { setPostText } from "./serializers.js";
import { Types } from "mongoose";
import Short from "../models/Short.js";
import { deleteFile } from "./file-handlers.js";

export const getAll = async ({
  query = {},
  model,
  match = {},
  dataKey,
  populate,
  sort = {}
}) => {
  try {
    let {
      limit = 20,
      cursor,
      asc = "false",
      withEq = "true",
      randomize = "true",
      withMatchedDocs = "false",
      exclude = "",
      withCount
    } = query;

    limit = (Number(limit) || 20) + 1;
    asc = asc === "true";
    withEq = withEq === "true";
    withMatchedDocs = withMatchedDocs === "true";
    randomize = randomize === "true";
    exclude = exclude ? exclude.split(",") : [];
    withCount = withCount ? withCount === "true" : !dataKey;

    const _getResult = async (cursor, withCursorRules = true) => {
      if (match._id?.$nin) {
        exclude = exclude.concat(match._id.$nin);
        delete match._id?.$nin;
      }

      if (populate === undefined) {
        const select = {
          "settings._id": 0,
          "socials._id": 0,
          password: 0
        };

        const options = { virtuals: true };
        populate = [
          {
            select,
            options,
            path: "user"
          },
          {
            path: "document",
            populate: "user"
          },
          dataKey
            ? {
                select,
                options,
                path: dataKey
              }
            : ""
        ];
      }

      if (cursor) cursor = decodeURIComponent(cursor);

      if (asc) sort[dataKey ? dataKey : "_id"] = 1;
      else sort[dataKey ? dataKey : "_id"] = -1;

      if (isObject(match._id)) {
        match._id = {
          ...match._id,
          $nin: exclude
        };
      } else {
        const value = match._id;

        match._id = {
          $nin: exclude
        };
        value && (match._id.$eq = value);
      }

      const $addFields = { _id: { $toString: "$_id" }, id: "$_id" };

      const pipelines = dataKey
        ? [
            { $addFields },
            { $match: match },
            { $project: { [dataKey]: 1 } },
            { $unwind: `$${dataKey}` }, // flatten dataKey as current data
            {
              $sort: sort
            },
            {
              $match: {
                [dataKey]: {
                  $nin: exclude
                }
              }
            },
            {
              $group: {
                _id: "$_id",
                [dataKey]: { $push: `$${dataKey}` }
              }
            }
          ]
        : [
            { $addFields },
            {
              $match: match
            },
            { $sort: sort },

            {
              $unset: ["_id", "password"]
            }
          ];

      const limitIndex = dataKey ? 6 : 3;

      if (randomize)
        pipelines.splice(limitIndex, 0, {
          $sample: { size: cursor ? limit : Infinity }
        });
      else if (cursor) pipelines.splice(limitIndex, 0, { $limit: limit });

      if (cursor) {
        const cursorIdRules = withCursorRules
          ? {
              [asc
                ? withEq
                  ? "$gte"
                  : "$gt"
                : withEq
                ? "$lte"
                : "$lt"]: cursor
            }
          : {};

        if (dataKey) {
          pipelines.splice(5, 1, {
            $match: {
              [dataKey]: {
                ...pipelines[5].$match[dataKey],
                ...cursorIdRules
              }
            }
          });
        } else {
          pipelines.splice(1, 1, {
            $match: {
              ...pipelines[1].$match,
              _id: {
                ...pipelines[1].$match._id,
                ...cursorIdRules
              }
            }
          });
        }
      }

      match = pipelines[1].$match;

      let result = await model.populate(
        await model.aggregate(pipelines),
        populate
      );

      match = pipelines[1].$match;

      if (dataKey && result[0]) result = result[0][dataKey];

      return result;
    };

    let result = await _getResult(cursor);

    if (withCount) delete match._id;

    const totalDoc = withCount
      ? await model.countDocuments(match)
      : result.length;

    cursor = null;

    result = result.slice(0, limit);

    // model.modelName === "user" &&
    //   console.log(totalDoc, result.length, withCount, match);

    if (result.length === limit) {
      cursor = result[limit - 1].id;
      result.pop();
    }

    return isProdMode
      ? {
          data: result,
          paging: {
            matchedDocs: totalDoc,
            nextCursor: cursor ? encodeURIComponent(cursor) : null
          }
        }
      : new Promise((rs, rj) => {
          setTimeout(() => {
            rs({
              data: result,
              paging: {
                matchedDocs: totalDoc,
                nextCursor: cursor ? encodeURIComponent(cursor) : null
              }

              // data: [],
              // paging: {
              //   matchedDocs: 0,
              //   nextCursor: null
              // }
            });
          }, 2000);
        });
  } catch (err) {
    throw err;
  }
};

export const sendAndUpdateNotification = async ({
  req,
  document,
  type,
  docType,
  filter = false,
  to,
  withFrom = false,
  docPopulate = "user document",
  cacheDoc,
  cacheType
}) => {
  let match;
  const from = req.user.id;
  try {
    const {
      maxNotificationAge: maxDay = 1,
      maxFromNotification: maxFrom = 20
    } = req.query;

    to =
      to ||
      req.params.userId ||
      (document
        ? document.document
          ? document.document.user?.id || document.document.user
          : document.user?.id || document.user
        : undefined);

    if (!withFrom && to === from) return;

    document = document && (document.id || document);
    docType = docType || (document && type);

    match = {
      type,
      document,
      to,
      docType,
      cacheType
    };

    if ({ follow: true }[type]) {
      match.$in = {
        users: [from]
      };
    }

    const populate = [
      {
        path: "to users"
      },
      {
        path: "document",
        populate: docPopulate
      }
    ];

    let report = true,
      isNew = false,
      filterNotice = false,
      notice,
      forceNotify;

    notice = await Notification.findOne(match).sort({
      createdAt: -1
    });

    if (filter) {
      if (notice) {
        if (notice.users.length - 1 === 0) {
          if (
            notice.expireAt &&
            notice.expireAt.getTime() < new Date().getTime()
          ) {
            filterNotice = true;

            await notice.deleteOne();
          } else if (!notice.expireAt) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + maxDay);

            notice = await Notification.findByIdAndUpdate(
              notice.id,
              {
                expireAt
              },
              { new: true }
            );
          }
        } else {
          notice = await Notification.findByIdAndUpdate(
            notice.id,
            {
              users: notice.users.filter(id => id !== from)
            },
            {
              new: true
            }
          );
        }
      }
    } else if (
      notice &&
      !notice.marked &&
      (notice.expireAt
        ? notice.expireAt.getTime() >= new Date().getTime()
        : true)
    ) {
      if (notice.users[0] !== from) notice.users.unshift(from);

      notice = await Notification.findByIdAndUpdate(
        notice.id,
        {
          users: notice.users,
          cacheDocs: cacheDoc
            ? [cacheDoc, ...notice.cacheDocs]
            : notice.cacheDocs
        },
        {
          new: true
        }
      );

      report = notice.users.length <= maxFrom;
    } else {
      if (notice && notice.users.includes(from)) {
        filterNotice = true;
        forceNotify = true;

        await notice.deleteOne();
      }
      isNew = true;
      match.users = [from];
      match.cacheDoc = cacheDoc;

      notice = await new Notification(match).save();
    }

    if (notice) notice = await notice.populate(populate);

    const io = req.app?.get("socketIo");

    if (io && notice && report) {
      if (filterNotice) io.emit("filter-notifications", [notice.id]);

      if (forceNotify || !filterNotice)
        io.emit("notification", notice, {
          filter,
          isNew
        });
    }
  } catch (err) {
    match && (match.users = [from]);
    console500MSG(err, "NOTIFICATION_ERROR");
  }
};

export const handleMiscDelete = async (docId, io, options = {}) => {
  const { withComment = true, cb, notificationMatch = {} } = options;

  try {
    if (withComment) {
      const deleteQuery = {
        $or: [
          { _id: docId },
          { document: docId },
          {
            rootThread: docId
          }
        ]
      };

      const comments = await Comment.find(deleteQuery);

      for (const c of comments) {
        await c.deleteOne();
        if (c.media?.url) deleteFile(c.media.url);
      }
    }

    const docQuery = {
      document: docId,
      ...notificationMatch
    };

    const notices = await Notification.find(docQuery);

    io &&
      notices.length &&
      io.emit("filter-notifications", notices.map(n => n.id || n));

    await Notification.deleteMany(docQuery);

    cb && cb();
  } catch (err) {
    console500MSG(err, "MISC_Delete_ERROR");
  }
};

export const getRoomSockets = (io, roomId) => {
  const ids = [];

  for (let id of io.sockets.adapter.rooms.get(roomId)?.values() || []) {
    ids.push(id);
  }

  return ids;
};

export const getRoomSocketAtIndex = (io, roomId, index = 0) =>
  io.sockets.sockets.get(getRoomSockets(io, roomId)[index]);

export const getThreadsByRelevance = async (
  docId,
  query = {},
  model,
  $expr = {}
) => {
  let { ro, threadPriorities = "ro,most comment", maxThread = "3" } = query;

  maxThread = Number(maxThread) || 3;
  maxThread = maxThread === Infinity ? await model.countDocuments() : maxThread;
  threadPriorities = threadPriorities.split(",");

  const populate = [
    {
      path: "user"
    },
    {
      path: "document",
      populate: [
        { path: "user" },
        {
          path: "document",
          populate: "user"
        }
      ]
    }
  ];

  const threads = [];

  let refIndex = 0,
    priority = 0,
    thread;

  while (refIndex < maxThread) {
    switch (threadPriorities[priority] || threadPriorities[0]) {
      case "ro":
        thread = await model
          .findOne({
            $expr,
            document: docId,
            user: ro
          })
          .sort({
            createdAt: -1
          })
          .populate(populate);

        if (thread) threads.push(thread);
        else priority = 1;

        break;
      case "most comment":
        thread = await model
          .findOne({
            $expr,
            document: docId
          })
          .sort({
            comments: -1,
            createdAt: -1
          })
          .populate(populate);

        if (thread) threads.push(thread);
        priority = -1;

        break;
      default:
        threadPriorities.push("ro");
        priority = threadPriorities.length - 1;

        break;
    }
    refIndex++;

    if (thread) docId = thread.id;
  }

  return threads;
};

export const getType = obj => {
  if (Array.isArray(obj)) return "array";
  else return typeof obj;
};

export const setFutureDate = days => {
  return new Date(new Date().getTime() + days * 86400000);
};

export const getMimetype = (s = "") => {
  if (!s) return "";

  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      mp3: "video/mp3"
    }[
      s
        .split("?")[0]
        .split(".")
        .pop()
        .toLowerCase()
    ] || "application/octet-stream"
  );
};

export const createDemoDocAndComment = async (
  userIdOrObj,
  hasShort,
  reqApp
) => {
  const postId = new Types.ObjectId();

  const isStr = typeof userIdOrObj === "string";

  const users = shuffleArray(
    isStr ? demoUsers.filter(u => u.id !== userIdOrObj) : demoUsers
  );

  const postUser = isStr ? users[0] : userIdOrObj;

  let posts = [],
    post = {};

  const model = hasShort ? Short : Post;

  const getMedia = (obj, type = "image") => {
    let media = obj.media;

    if (!media && obj.medias) {
      media = obj.medias.find(m => m.mimetype.indexOf(type) > -1);
    }

    return media || undefined;
  };

  let docMedia,
    docIndex = 0;

  posts = shuffleArray(demoPost);

  do {
    post = posts[docIndex];

    setPostText(post);

    docMedia = hasShort ? getMedia(post, "video") : {};
    docIndex++;
  } while (
    !docMedia ||
    !!(await model.findOne({
      user: postUser.id,
      text: post.text
    }))
  );

  const newPost = await new model({
    ...post,
    ...docMedia,
    isDemo: true,
    _id: postId,
    user: postUser.id
  }).save();

  await User.updateOne(
    {
      _id: postUser.id
    },
    {
      $inc: {
        [`${model.modelName}Count`]: 1
      }
    }
  );

  if (!hasShort) {
    let size = 0,
      commenterIndex = 1,
      isRC = false;

    while (size < 15) {
      size++;

      let _comment;

      let commentObj = post._comments[isRC ? size : 0] || posts[size + 1];

      if (commentObj.rc) isRC = true;
      else isRC = false;

      const getOtherUser = i => {
        let user = users[i];

        if (user.id === postUser.id) user = users[i + 1] || users[1];

        return user;
      };

      const commenter = commentObj.user
        ? postUser
        : getOtherUser(commenterIndex);

      commenterIndex = commenterIndex > 6 ? 0 : commenterIndex + 1;

      const body = {
        isDemo: true,
        text: commentObj.text,
        user: commenter.id,
        document: newPost.id,
        docType: "post",
        media: getMedia(commentObj)
      };

      const pushComment = async user => {
        const docPopulate = [
          {
            path: "user"
          },
          {
            path: "document",
            populate: [
              {
                path: "user"
              },
              {
                path: "document",
                populate: "user"
              }
            ]
          }
        ];

        body.text =
          body.text || `Nulla quis aliqua eu occaecat anim ea ea amet elit.`;

        const comment = await (await new Comment(body).save()).populate(
          docPopulate
        );

        await {
          post: Post,
          comment: Comment
        }[body.docType].updateOne(
          {
            _id: body.document
          },
          {
            $push: {
              comments: body.user
            }
          }
        );

        _comment = comment;

        user &&
          sendAndUpdateNotification({
            req: {
              user,
              query: {},
              params: {},
              app: reqApp
            },
            docPopulate,
            type: "comment",
            document: comment
          });
      };

      await pushComment(commenter);

      if (Math.floor(Math.random() * 15) % 2 === 0)
        for (let i = 1; i < 6; i++) {
          commentObj = post._comments[isRC ? -1 : i] || posts[i + 1];

          const user = commentObj.user ? postUser : getOtherUser(i);

          body.text = commentObj.text;
          body.media = getMedia(commentObj);
          body.user = user.id;
          body.rootThread = _comment.rootThread;
          body.rootType = _comment.rootType;
          body.document = _comment.id;
          body.docType = "comment";

          await pushComment();
        }
    }
  }
};
