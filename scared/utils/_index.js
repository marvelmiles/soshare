import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";
import crypto from "crypto";
import { Types } from "mongoose";
import { isObject } from "./validators.js";
import Comment from "../models/Comment.js";
import { shuffleArray } from "../utils/normalizers.js";
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
  match,
  populate = [
    {
      path: "user"
    }
  ],
  sort = {},
  dataKey
}) => {
  try {
    let {
      limit = 20,
      cursor,
      asc = "false",
      withEq = "true",
      randomize,
      withTotalDocs = "false",
      exclude = ""
    } = query;
    limit = (Number(limit) || 20) + 1;
    asc = asc === "true";
    withEq = withEq === "true";
    withTotalDocs = withTotalDocs === "true";
    randomize = randomize === "true";
    exclude = (exclude ? exclude.split(",") : []).map(
      id => new Types.ObjectId(id)
    );
    if (cursor) cursor = decodeURIComponent(cursor);
    let result, totalDocuments, skippedLimit;
    if (dataKey) {
      result = (await model.findOne(match)?.populate(dataKey))[dataKey] || [];
      withTotalDocs && (totalDocuments = result.length);
      if (result.length) {
        if (!asc) {
          result.sort(function(a, b) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
        let index = cursor
          ? result.findIndex(
              item =>
                (item.id || item._id.toString()) === cursor || item === cursor
            )
          : randomize
          ? (skippedLimit = Math.floor(
              Math.random() *
                (totalDocuments || (totalDocuments = result.length))
            ))
          : 0;
        index = index < 0 ? 0 : index;
        result = result.slice(index, index + limit);
      }
    } else {
      if (asc) sort._id = 1;
      else sort._id = -1;
      withTotalDocs && (totalDocuments = await model.countDocuments(match));
      const pipelines = [
        {
          $match: {
            ...match,
            $or: match._id
              ? [{ _id: match._id }].concat(match._id.$or || [])
              : [{}],
            _id: {
              $nin: exclude
            }
          }
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
      if (cursor) {
        pipelines.splice(0, 0, {
          $match: {
            ...pipelines[0].$match,
            _id: {
              ...pipelines[0].$match._id,
              [asc
                ? withEq
                  ? "$gte"
                  : "$gt"
                : withEq
                ? "$lte"
                : "$lt"]: new Types.ObjectId(cursor)
            }
          }
        });
      } else if (randomize) {
        totalDocuments = totalDocuments || (await model.countDocuments(match));
        pipelines.splice(2, 0, { $sample: { size: limit } });
      }
      result = await model.populate(await model.aggregate(pipelines), populate);
    }
    cursor = null;
    if (result.length === limit) {
      cursor = result[limit - 1].id;
      result.pop();
    }
    return {
      data: result,
      paging: {
        totalDocuments,
        skippedLimit,
        nextCursor: cursor ? encodeURIComponent(cursor) : null
      }
    };
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
  eventName,
  docPopulate,
  maxFromNotification = 20,
  throwErr
}) => {
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
  docType = docType || { coment: "comment" }[type];
  const from = req.user.id;
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
          { follow: { to: notice.to, from: notice.users[0] } }[type] ||
            notice.document ||
            notice
        );
    }
  } catch (err) {
    if (throwErr) throw err;
    match.users = [from];
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
};

export const getRoomSockets = (io, roomId) => {
  const ids = [];
  for (let id of io.sockets.adapter.rooms.get(roomId)?.values() || []) {
    ids.push(id);
  }
  return ids;
};

// await model.updateMany({}, [
//   {
//     $set: {
//       following: {
//         $map: {
//           input: "$following",
//           in: { $toObjectId: "$$this" }
//         }
//       },
//       followers: {
//         $map: {
//           input: "$followers",
//           in: { $toObjectId: "$$this" }
//         }
//       },
//       recommendationBlacklist: {
//         $map: {
//           input: "$recommendationBlacklist",
//           in: { $toObjectId: "$$this" }
//         }
//       }
//     }
//   }
// ]);
