import User from "../models/User.js";
import { createError } from "../utils/error.js";
import Post from "../models/Post.js";
import {
  getAll,
  sendAndUpdateNotification,
  getRoomSocketAtIndex
} from "../utils/index.js";
import { deleteFile } from "../utils/file-handlers.js";
import Notification from "../models/Notification.js";
import Short from "../models/Short.js";
import { isObject } from "../utils/validators.js";
import bcrypt from "bcrypt";
import { getDocument, getFeedMedias } from "../utils/req-res-hooks.js";
import { mapToObject } from "../utils/normalizers.js";
import {
  getAllIntervally,
  clearGetAllIntervallyTask
} from "../utils/schedule-tasks.js";
import { SUGGESTED_USERS, SUGGEST_FOLLOWERS_TASK_KEY } from "../config.js";
import { hashToken } from "../utils/auth.js";
import mongoose from "mongoose";
import { validateBlacklist } from "../utils/user.js";
import {
  HTTP_MSG_USER_EXISTS,
  HTTP_CODE_INVALID_USER_ACCOUNT
} from "../constants.js";

export const getUser = (req, res, next) =>
  getDocument({
    req,
    res,
    next,
    model: User
  });

export const getFollowing = async (req, res, next) => {
  return getFeedMedias({
    req,
    res,
    next,
    model: User,
    dataKey: "following",
    match: {
      _id: req.params.userId || req.user.id
    },
    verify: true
  });
};

export const getFollowers = async (req, res, next) => {
  return getFeedMedias({
    req,
    res,
    next,
    model: User,
    dataKey: "followers",
    match: {
      _id: req.params.userId || req.user.id
    }
  });
};

export const follow = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (!userId) throw createError("Invalid parameter. Check url");

    if (req.user.id === userId) throw createError("You can't follow yourself");

    await validateBlacklist(req.user, userId);

    const user = await User.findByIdAndUpdate(
      {
        _id: req.user.id
      },

      {
        $addToSet: {
          following: userId
        }
      },
      { new: true }
    );
    const _user = await User.findByIdAndUpdate(
      {
        _id: userId
      },
      {
        $addToSet: {
          followers: req.user.id
        }
      },
      { new: true }
    );
    const io = req.app.get("socketIo");
    if (io) {
      io.emit("update-user", user);
      io.emit("update-user", _user);
      io.emit("follow", {
        from: user,
        to: _user
      });
    }
    res.json("Successfully followed user");
    sendAndUpdateNotification({
      req,
      type: "follow"
    });
  } catch (err) {
    next(err);
  }
};

export const unfollow = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (userId === req.user.id)
      throw createError("You can't unfollow yourself");

    await validateBlacklist(req.user, userId);

    const user = await User.findByIdAndUpdate(
      { _id: req.user.id },
      {
        $pull: {
          following: userId
        }
      },
      { new: true }
    );

    const _user = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $pull: {
          followers: req.user.id
        }
      },
      { new: true }
    );
    const io = req.app.get("socketIo");
    if (io) {
      io.emit("update-user", user);
      io.emit("update-user", _user);
      io.emit("unfollow", {
        from: user,
        to: _user
      });
    }
    res.json("Successfully unfollowed user");
    sendAndUpdateNotification({
      req,
      type: "follow",
      filter: true
    });
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  return getFeedMedias({
    req,
    res,
    next,
    model: Post,
    match: {
      user: req.params.userId || req.user.id
    }
  });
};

export const suggestFollowers = async (req, res, next) => {
  try {
    const { following, recommendationBlacklist = [], blockedUsers = [] } =
      (await User.findById(req.user.id)) || {};
    if (!following) throw createError(`User not found`, 404);

    const queryConfig = {
      model: User,
      match: {
        _id: {
          $nin: following.concat(
            recommendationBlacklist,
            blockedUsers,
            req.user.id
          )
        }
      },
      query: req.query
    };

    let result = await getAll(queryConfig);
    res.json(result);

    const io = req.app.get("socketIo");
    const mapFn = user => user.id.toString();

    let socket;
    if (
      (socket = getRoomSocketAtIndex(io, req.user.id)) &&
      socket.handshake.withCookies
    ) {
      getAllIntervally(
        queryConfig,
        socket,
        result.paging.nextCursor,
        SUGGEST_FOLLOWERS_TASK_KEY,
        {
          eventName: "suggest-followers",
          blacklist: result.data.map(mapFn),
          mapFn
        }
      );
    } else if (socket)
      // just incase, socket.disconnect should do it.
      clearGetAllIntervallyTask(socket, SUGGEST_FOLLOWERS_TASK_KEY);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { photoUrl, _id, socials, accountType } =
      (await User.findById(req.user.id)) || {};

    const isDemo = accountType === "demo";

    if (!isDemo) req.body.photoUrl = req.file?.publicUrl;

    if (
      !!(await User.findOne({
        _id: {
          $ne: _id
        },
        $or: [{ email: req.body.email }, { username: req.body.username }]
      }))
    )
      throw createError(
        HTTP_MSG_USER_EXISTS,
        400,
        HTTP_CODE_INVALID_USER_ACCOUNT
      );

    if (!_id) {
      next(createError("Account doesn't exist", 400));
      req.file.publicUrl && deleteFile(req.file.publicUrl);
      return;
    }

    if (req.body.socials) {
      if (!isObject(req.body.socials))
        return next(
          createError(
            `Expect body.socials to be of type Object got ${typeof req.body
              .socials}`,
            400
          )
        );
      req.body.socials = {
        ...socials,
        ...req.body.socials
      };
    }

    delete req.body.password;

    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true
    });

    const io = req.app.get("socketIo");

    if (io) io.emit("update-user", user, true);

    res.json(user);

    if (!isDemo && req.file && photoUrl) {
      deleteFile(photoUrl).catch(err => {});
    }
  } catch (err) {
    next(err);
  }
};

export const getUserNotifications = async (req, res, next) => {
  try {
    const match = {
      to: req.user.id,
      marked: req.query.type === "marked"
    };
    if (req.query.timeago) {
      query.createdAt = {
        $lte: new Date(),
        $gte: new Date(req.query.timeago)
      };
    }
    res.json(
      await getAll({
        model: Notification,
        match,
        query: req.query,
        populate: [
          {
            path: "to users"
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
        ]
      })
    );
  } catch (err) {
    next(err);
  }
};

export const getUnseenAlerts = async (req, res, next) => {
  try {
    const query = {
      to: req.user.id,
      marked: req.query.type === "marked"
    };
    if (req.query.timeago) {
      query.createdAt = {
        $lte: new Date(),
        $gte: new Date(req.query.timeago)
      };
    }

    res.json({
      notifications: await Notification.find(query)
        .skip(req.query.skip || 0)
        .countDocuments()
    });
  } catch (err) {
    next(err);
  }
};

export const markNotifications = async (req, res, next) => {
  const update = async (start = 0) => {
    const errs = [];
    let count = 0,
      activeId;
    do {
      try {
        for (let i = start; i < req.body.length; i++) {
          activeId = req.body[i];
          count = start + 1;
          const notice = await Notification.findById(activeId);
          await notice.updateOne({
            marked: true
          });
        }
      } catch (err) {
        if (req.query.sequentialEffect === "true")
          throw createError(err.message, 409);
        else {
          errs.push({
            name: err.name,
            message: err.message,
            status: 409,
            id: activeId,
            stackName: "customError"
          });
          if (count === req.body.length) {
            throw createError(
              {
                name: "customError",
                message: errs
              },
              409
            );
          }
        }
      }
    } while (count !== req.body.length);
  };
  try {
    await update();
    res.json(
      `Notification${req.body.length > 1 ? "s" : ""} updated successfully`
    );
  } catch (err) {
    next(err);
  }
};

export const getUserShorts = async (req, res, next) => {
  const start = new Date();
  start.setDate(start.getDate() - (Number(req.query.date) || 1));

  getFeedMedias({
    req,
    res,
    next,
    model: Short,
    match: {
      user: req.params.userId || req.user.id,
      createdAt: {
        $gte: start
      }
    }
  });
};

export const blacklistUser = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body))
      throw createError("Invalid request: Expect body to be an array");

    const action = req.params.action;

    const key = {
      block: "blockedUsers",
      disapprove: "recommendationBlacklist"
    }[action];

    if (!key)
      throw createError(
        "Invalid request: Expect /users/blacklist/<disapprove|block>",
        400
      );

    if (req.body.includes(req.user.id))
      throw createError(`You can't ${action} yourself`);

    const updateProp = { new: true };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: {
          [key]: req.body
        }
      },
      updateProp
    );

    const io = req.app.get("socketIo");

    user && io.emit("update-user", user);

    res.json(
      `@${user.username} ${
        { disapprove: "disapproved", block: "blocked" }[action]
      } successfully`
    );

    const socket = getRoomSocketAtIndex(io, req.user.id);

    if (socket) {
      socket.handshake[SUGGESTED_USERS] = socket.handshake[
        SUGGESTED_USERS
      ].concat(req.params.userId);
    }
  } catch (err) {
    next(err);
  }
};

export const deleteUserNotification = async (req, res, next) => {
  try {
    await Notification.deleteOne({
      _id: req.params.id
    });

    res.json("Deleted notification successfully");
  } catch (err) {
    next(err);
  }
};

export const getBlacklist = async (req, res, next) => {
  // console.log("getting blacklist", req.query.select, req.query.q);

  try {
    const result = {};

    for (const key of (req.query.select || "recommendation blocked").split(
      " "
    )) {
      const search = req.query.q
        ? {
            $regex: req.query.q,
            $options: "i"
          }
        : { $ne: "" };

      const props = {
        query: req.query,
        model: User,
        match: {
          _id: req.params.userId || req.user.id
        },
        populate: [
          {
            // select: {
            //   "settings._id": 0,
            //   "socials._id": 0,
            //   password: 0
            // },
            options: { virtuals: true },
            match: {
              $or: [
                {
                  displayName: search
                },
                {
                  username: search
                },
                {
                  email: search
                },
                {
                  bio: search
                },
                {
                  location: search
                },
                {
                  occupation: search
                }
              ]
            }
          }
        ]
      };
      switch (key) {
        case "recommendation":
          props.dataKey = "recommendationBlacklist";
          props.populate[0].path = props.dataKey;

          result[key] = await getAll(props);
          continue;
        case "blocked":
          props.dataKey = "blockedUsers";
          props.populate[0].path = props.dataKey;

          result[key] = await getAll(props);
          continue;
        default:
          result[key] = {
            data: [],
            paging: {
              nextCursor: null,
              matchedDocs: 0
            }
          };
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const whitelistUsers = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body))
      throw createError("Invalid request: Expect body to be an array");

    const key = {
      disapprove: "recommendationBlacklist",
      block: "blockedUsers"
    }[req.params.action];

    if (!key)
      throw createError(
        `Invalid request: Expect /users/whitelist/<block|disapprove> got ${req.url}`,
        400
      );

    let list = (await User.findById(req.user.id))?.[key];

    if (list) {
      if (!Array.isArray(req.body))
        throw createError("Invalid body expect an array of id");

      if (req.body.length) {
        const bodyMap = mapToObject(req.body);

        const user = await User.findByIdAndUpdate(
          req.user.id,
          {
            [key]: list.filter(_id => bodyMap[_id] === undefined)
          },
          {
            new: true
          }
        );

        const io = req.app.get("socketIo");

        io && io.emit("update-user", user);
      }
    }

    res.json(
      `Whitelisted ${req.body.length > 1 ? "users" : "user"} successfully`
    );
  } catch (err) {
    next(err);
  }
};

// (async () => {
//   const uid = "6549dc736af52d558061f653";
//   const users = await User.find({
//     _id: {
//       $ne: uid
//     }
//   });
//   const _u = await User.findById(uid);

//   await _u.updateOne({
//     blockedUsers: users.map(u => u._id)
//   });
// })();
