import User from "../models/User.js";
import { createError } from "../utils/error.js";
import Post from "../models/Post.js";
import {
  getAll,
  sendAndUpdateNotification,
  getRoomSockets
} from "../utils/index.js";
import { createVisibilityQuery } from "../utils/serializers.js";
import { deleteFile } from "../utils/file-handlers.js";
import Notification from "../models/Notification.js";
import mongoose, { Types } from "mongoose";
import Short from "../models/Short.js";
import { verifyToken } from "../utils/middlewares.js";
import { isObject } from "../utils/validators.js";
import bcrypt from "bcrypt";
import { getDocument, getFeedMedias } from "../utils/req-res-hooks.js";
import { mapToObject } from "../utils/normalizers.js";

export const getUser = (req, res, next) =>
  getDocument({
    req,
    res,
    next,
    model: User
    // verify: true
  });

export const getFollowing = async (req, res, next) => {
  return getFeedMedias({
    req,
    res,
    next,
    model: User,
    dataKey: "following"
    // verify: true
  });
};

export const getFollowers = async (req, res, next) => {
  // req.query.randomize = "false";
  // req.query.withMatchedDocs = "true";
  // // console.clear();
  // return res.json({
  //   paging: {
  //     nextCursor: null,
  //     data: []
  //   }
  // });
  return getFeedMedias({
    req,
    res,
    next,
    model: User,
    dataKey: "followers"
  });
};

export const follow = async (req, res, next) => {
  try {
    console.log(" follow user ", req.user.id, req.params.userId);
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
    console.log(err.message, " follow ");
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
    console.log(err.message, " unfollow");
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  return getFeedMedias({
    req,
    res,
    next,
    model: Post,
    // verify: true,
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
      // verify: true
      // vet: true
    };
    let result = await getAll(queryConfig);
    res.json(result);
    const io = req.app.get("socketIo");
    const socketId = getRoomSockets(io, req.user.id)[0];
    let socket;
    if (
      false &&
      socketId &&
      (socket = io.sockets.sockets.get(socketId)) &&
      socket.handshake.withCookies &&
      !socket.handshake.suggestFollowersTime
    ) {
      socket.handshake.suggestFollowersTime = setTimeout(() => {
        const suggest = async () => {
          queryConfig.match._id.$nin = queryConfig.match._id.$nin.concat(
            result.data
          );
          queryConfig.query = {
            ...queryConfig.query,
            cursor: result.paging.nextCursor
          };
          result = await getAll(queryConfig);
          io.to(req.user.id).emit("suggest-followers", result);
        };
        suggest();
        socket.handshake.suggestFollowersInterval = setInterval(suggest, 2000);
      }, 2000);
    }
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

// trying to avoid multiple api call for a similar purpose
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
  // createdAt: {
  //   // $gt: start
  // }
  getFeedMedias({
    req,
    res,
    next,
    model: Short
  });
};

export const blacklistUserRecommendation = async (req, res, next) => {
  try {
    console.log(" black user ", req.params.userId);
    return res.json("Blacklisted successfully");
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
    console.log(" delete notification ");
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
    dataKey: "recommendationBlacklist",
    vet: true
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
