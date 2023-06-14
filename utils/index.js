import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";
import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import { isObject } from "./validators.js";
import Comment from "../models/Comment.js";
import { shuffleArray } from "../utils/normalizers.js";
import User from "../models/User.js";
import Short from "../models/Short.js";
import Post from "../models/Post.js";
import { v4 as uuidv4 } from "uuid";
import bson, { ObjectId } from "bson";
export const setTokens = async (res, id, rememberMe, accessOnly) => {
  rememberMe = rememberMe === "true";
  const shortT = new Date();
  const longT = new Date();
  if (id) {
    shortT.setMinutes(shortT.getMinutes() + 30);
    if (rememberMe) longT.setDate(longT.getDate() + 28);
    else longT.setHours(longT.getHours() + 6);
  } else {
    shortT.setFullYear(1990);
    longT.setFullYear(1990);
  }
  res.cookie(
    "access_token",
    id
      ? jwt.sign(
          {
            id
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "5m"
          }
        )
      : "",
    {
      httpOnly: true,
      expires: shortT
    }
  );

  if (!accessOnly)
    res.cookie(
      "refresh_token",
      id
        ? JSON.stringify({
            jwt: jwt.sign(
              {
                id
              },
              process.env.JWT_SECRET,
              { expiresIn: "15m" }
            ),
            rememberMe
          })
        : "",
      {
        httpOnly: true,
        expires: longT
      }
    );
};

// Rm duplicate: group by _id and project a new root of the first document
// only which will verify no document is returned twice.
export const getAll = async ({
  query = {},
  model,
  match = {},
  dataKey,
  populate,
  sort = {},
  verify,
  vet
}) => {
  try {
    let {
      limit = 20,
      cursor,
      asc = "false",
      withEq = "true",
      randomize,
      withMatchedDocs = "false",
      exclude = ""
    } = query;

    limit = (Number(limit) || 20) + 1;

    asc = asc === "true";
    withEq = withEq === "true";
    withMatchedDocs = withMatchedDocs === "true";
    randomize = randomize === "true";

    // verify && console.log(cursor, exclude, " curosr  ");

    vet && console.log(cursor, exclude, " curosr  ");

    exclude = exclude ? exclude.split(",") : [];
    // verify && console.log(exclude);

    vet && console.log(exclude);

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

    let result, matchedDocs, skippedLimit;

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

    // verify && console.log(withMatchedDocs, randomize, exclude, " with match ");

    // vet && console.log(withMatchedDocs, randomize, exclude, " with match ");

    (withMatchedDocs || randomize) &&
      (matchedDocs = dataKey
        ? ((await model.findOne(match)) || {})[dataKey]?.length || 0
        : await model.countDocuments(match));

    // vet &&
    //   console.log(match.$expr.$cond, withMatchedDocs, randomize, matchedDocs);

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
            $limit: limit
          },
          {
            $unset: ["_id", "password"]
          }
        ];
    if (randomize)
      pipelines.splice(dataKey ? 5 : 3, 0, { $sample: { size: limit } });

    if (cursor) {
      const cursorIdRules = {
        [asc ? (withEq ? "$gte" : "$gt") : withEq ? "$lte" : "$lt"]: cursor
      };
      if (dataKey) {
        pipelines.splice(
          randomize ? 6 : 5,
          0,
          {
            $match: {
              [dataKey]: {
                ...pipelines[5].$match[dataKey],
                ...cursorIdRules
              }
            }
          },
          { $limit: limit }
        );
      } else {
        pipelines.splice(1, 0, {
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
    // vet && console.log(pipelines[1].$match);
    result = await model.populate(await model.aggregate(pipelines), populate);

    if (dataKey && result[0]) result = result[0][dataKey];

    cursor = null;
    if (result.length === limit) {
      cursor = result[limit - 1].id;
      result.pop();
    }
    return new Promise(r => {
      setTimeout(
        () =>
          r({
            data: result,
            paging: {
              matchedDocs,
              skippedLimit,
              nextCursor: cursor ? encodeURIComponent(cursor) : null
            }
          }),
        2000
      );
    });
  } catch (err) {
    verify && console.log(err.message, " get  all ");
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
  docPopulate = "user document"
}) => {
  let match;
  const from = req.user.id;
  try {
    const {
      maxNotificationAge: maxAge = 1,
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
      docType
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
      notice;

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
          } else {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + maxAge);
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
    } else if (notice && !notice.marked) {
      let index;
      if (
        (index = notice.users.findIndex(id => id === from)) < 0 ||
        (notice.expireAt
          ? notice.expireAt.getTime() < new Date().getTime()
          : false)
      ) {
        index > -1 && notice.users.splice(index, 1);
        notice.users.unshift(from);
        notice = await Notification.findByIdAndUpdate(
          notice.id,
          {
            users: notice.users
          },
          {
            new: true
          }
        );
        report = notice.users.length <= maxFrom;
      }
    } else if (notice ? !notice.users.includes(from) : true) {
      isNew = true;
      match.users = [from];
      notice = await new Notification(match).save();
    }

    if (notice) notice = await notice.populate(populate);

    const io = req.app.get("socketIo");

    if (io && notice && report) {
      if (filterNotice) io.emit("filter-notifications", [notice.id]);
      else
        io.emit("notification", notice, {
          filter,
          isNew
        });
    }
  } catch (err) {
    match && (match.users = [from]);
    console.error(
      `[Error Sending Notification]: Match data: ${
        err.message
      }: ${JSON.stringify(match)} at ${new Date()}.`
    );
  }
};

export const generateToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

export const handleMiscDelete = async (docId, io, withComment = true) => {
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
      (await Comment.find(deleteQuery)).forEach(
        c => c.media?.url && deleteFile(c.media.url)
      );
      await Comment.deleteMany(deleteQuery);
    }

    const docQuery = {
      document: docId
    };
    const notices = await Notification.find(docQuery);
    io &&
      notices.length &&
      io.emit("filter-notifications", notices.map(n => n.id || n));
    await Notification.deleteMany(docQuery);
  } catch (err) {
    console.error(
      `[Error misc delete]: id: ${doocId}. ${err.message} at ${new Date()}.`
    );
  }
};

export const getRoomSockets = (io, roomId) => {
  const ids = [];
  for (let id of io.sockets.adapter.rooms.get(roomId)?.values() || []) {
    ids.push(id);
  }
  return ids;
};

export const getThreadsByRelevance = async (docId, query = {}, model) => {
  let { ro, threadPriorities = "ro,most comment", maxThread = "2" } = query;
  maxThread = Number(maxThread) || 2;
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
