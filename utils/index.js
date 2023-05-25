import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";
import crypto from "crypto";
import { Types } from "mongoose";
import { isObject } from "./validators.js";
import Comment from "../models/Comment.js";
import { shuffleArray } from "../utils/normalizers.js";
import User from "../models/User.js";

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
  t
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
    exclude = (exclude ? exclude.split(",") : []).map(
      id => new Types.ObjectId(id)
    );

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
      match._id = {
        ...(match._id
          ? {
              $eq: new Types.ObjectId(match._id)
            }
          : {}),
        $nin: exclude
      };
    }

    (withMatchedDocs || randomize) &&
      (matchedDocs = dataKey
        ? ((await model.findOne(match)) || {})[dataKey]?.length || 0
        : await model.countDocuments(match));

    const pipelines = dataKey
      ? [
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
            $unset: ["_id", "password"]
          }
        ];
    if (randomize)
      pipelines.splice(dataKey ? 4 : 2, 0, { $sample: { size: limit } });

    if (cursor) {
      const cursorIdRules = {
        [asc
          ? withEq
            ? "$gte"
            : "$gt"
          : withEq
          ? "$lte"
          : "$lt"]: new Types.ObjectId(cursor)
      };
      if (dataKey) {
        pipelines.splice(
          randomize ? 5 : 4,
          0,
          {
            $match: {
              [dataKey]: {
                ...pipelines[4].$match[dataKey],
                ...cursorIdRules
              }
            }
          },
          { $limit: limit }
        );
      } else
        pipelines.splice(0, 0, {
          $match: {
            ...pipelines[0].$match,
            _id: {
              ...pipelines[0].$match._id,
              ...cursorIdRules
            }
          }
        });
    }
    // if (t) {
    //   console.clear();
    //   console.log(match);
    // }
    result = await model.populate(await model.aggregate(pipelines), populate);

    if (dataKey && result[0]) result = result[0][dataKey];

    cursor = null;
    if (result.length === limit) {
      cursor = result[limit - 1].id;
      result.pop();
    }
    return {
      data: result,
      paging: {
        matchedDocs,
        skippedLimit,
        nextCursor: cursor ? encodeURIComponent(cursor) : null
      }
    };
  } catch (err) {
    console.log(err.message, " err ");
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
  eventName,
  docPopulate = "user document",
  maxFromNotification = 20,
  withFrom = false
}) => {
  const from = req.user.id;
  to =
    to ||
    req.params.userId ||
    (document
      ? document.user
        ? document.user.id || document.user
        : document.id || document
      : undefined);
  eventName =
    eventName ||
    {
      follow: filter ? "unfollow" : "follow"
    }[type] ||
    type;
  document = document && (document.id || document);
  docType = docType || (document && type);
  withFrom = type === "like";
  if (!withFrom) to = to === from ? undefined : to;

  let match = { type, document, to, docType };
  try {
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
    notice = await Notification.findOne(match);
    if (filter) {
      if (notice)
        if (notice.users.length - 1 === 0) {
          filterNotice = true;
          await notice.deleteOne();
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
    } else if (notice && !notice.marked) {
      if (notice.users.includes(from)) report = false;
      else {
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
        report = notice.users.length <= maxFromNotification;
      }
    } else {
      isNew = true;
      match.users = [from];
      notice = await new Notification(match).save();
    }

    if (notice) notice = await notice.populate(populate);

    const io = req.app.get("socketIo");
    console.clear();
    console.log(!!notice?.to, eventName, notice?.marked, filter);
    if (io && notice) {
      if (report) {
        if (filterNotice) io.emit("filter-notifications", [notice.id]);
        else
          io.emit("notification", notice, {
            filter,
            eventName,
            isNew
          });
      }
      eventName &&
        io.emit(
          eventName,
          {
            follow: {
              to: notice.to,
              from: notice.users[0] || (await User.findById(from))
            }
          }[type] ||
            notice.document ||
            notice
        );
    }
  } catch (err) {
    match.users = [from];
    console.error(
      `[Error Sending Notification]: Match data: ${
        err.message
      }: ${JSON.stringify(match)} at ${new Date()}.`
    );
    throw err;
  }
};

export const generateToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

export const findThreadByRelevance = async ({
  model = Comment,
  docId,
  populate,
  query: { ro, threadPriorities = "ro,most comment" }
}) => {
  let refIndex = -1,
    doc;
  threadPriorities = threadPriorities.split(",");
  do {
    refIndex++;
    doc = {
      ro: await model
        .findOne({
          user: ro,
          document: docId
        })
        .sort({ createdAt: -1 })
        .populate(populate),
      "most comment": await Comment.findOne({
        document: docId
      })
        .sort({ comments: -1 })
        .populate(populate)
    }[threadPriorities[refIndex]];
    doc = doc === null ? undefined : doc === undefined ? {} : doc;
  } while (!doc);
  return doc.id ? doc : null;
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
