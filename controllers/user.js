import User from "../models/User.js";
import { createError } from "../utils/error.js";
import Post from "../models/Post.js";
import {
  getAll,
  sendAndUpdateNotification,
  getRoomSockets
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
      _id: req.params.userId
    }
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
      _id: req.params.userId
    }
  });
};

export const follow = async (req, res, next) => {
  try {
    if (!req.params.userId) throw createError("Invalid parameter. Check url");
    if (req.user.id === req.params.userId)
      throw createError("You can't follow yourself");
    const user = await User.findByIdAndUpdate(
      {
        _id: req.user.id
      },

      {
        $addToSet: {
          following: req.params.userId
        }
      },
      { new: true }
    );
    const _user = await User.findByIdAndUpdate(
      {
        _id: req.params.userId
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
    if (req.params.userId === req.user.id)
      throw createError("You can't unfollow yourself");
    const user = await User.findByIdAndUpdate(
      { _id: req.user.id },
      {
        $pull: {
          following: req.params.userId
        }
      },
      { new: true }
    );

    const _user = await User.findByIdAndUpdate(
      { _id: req.params.userId },
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
    isVisiting: true
  });
};

export const suggestFollowers = async (req, res, next) => {
  try {
    const { following, recommendationBlacklist } =
      (await User.findById(req.user.id)) || {};
    if (!following) throw createError(`User not found`, 404);

    const queryConfig = {
      model: User,
      match: {
        _id: {
          $nin: following.concat(recommendationBlacklist, req.user.id)
        }
      },
      query: req.query
    };
    let result = await getAll(queryConfig);
    res.json(result);
    const io = req.app.get("socketIo");
    const socketId = getRoomSockets(io, req.user.id)[0];
    const mapFn = user => user.id.toString();
    let socket;
    if (
      socketId &&
      (socket = io.sockets.sockets.get(socketId)) &&
      socket.handshake.withCookies
    ) {
      getAllIntervally(
        queryConfig,
        socket,
        result.paging.nextCursor,
        "suggestFollowersInterval",
        {
          eventName: "suggest-followers",
          blacklist: result.data.map(mapFn),
          mapFn
        }
      );
    } else if (socket)
      // just incase, socket.disconnect should do it.
      clearGetAllIntervallyTask(socket, "suggestFollowersInterval");
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    req.body.photoUrl = req.file?.publicUrl;
    const { photoUrl, _id, socials } = (await User.findById(req.user.id)) || {};
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
    if (req.body.password) {
      if (req.body.password.length < 8)
        throw createError("A minimum of 8 character password is required", 400);
      req.body.password = await bcrypt.hash(
        req.body.password,
        await bcrypt.genSalt()
      );
    }

    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true
    });
    const io = req.app.get("socketIo");
    if (io) io.emit("update-user", user, true);
    res.json(user);
    if (req.file && photoUrl) {
      await deleteFile(photoUrl);
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
    isVisiting: true,
    match: {
      createdAt: {
        $gte: start
      }
    }
  });
};

export const blacklistUserRecommendation = async (req, res, next) => {
  try {
    if (req.user.id === req.params.userId)
      throw createError("You can't blacklist yourself");

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: {
          recommendationBlacklist: req.params.userId
        }
      },
      { new: true }
    );
    const io = req.app.get("socketIo");

    io && io.emit("update-user", user);
    res.json("Blacklisted successfully");
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
  return getFeedMedias({
    req,
    res,
    next,
    model: User,
    dataKey: "recommendationBlacklist"
  });
};

export const whitelistUsers = async (req, res, next) => {
  try {
    let list = (await User.findById(req.user.id))?.recommendationBlacklist;

    if (list) {
      if (!Array.isArray(req.body))
        throw createError("Invalid body expect an array of id");
      if (req.body.length) {
        const user = await User.findByIdAndUpdate(
          req.user.id,
          {
            recommendationBlacklist: list.filter(
              _id => mapToObject(req.body)[_id] === undefined
            )
          },
          {
            new: true
          }
        );
        const io = req.app.get("socketIo");
        io && io.emit("update-user", user);
      }
    }
    res.json("Whitelisted users successfully");
  } catch (err) {
    next(err);
  }
};
