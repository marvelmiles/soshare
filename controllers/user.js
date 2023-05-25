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
    match: {
      _id: new Types.ObjectId(req.params.id)
    },
    dataKey: "following"
  });
};

export const getFollowers = async (req, res, next) =>
  getFeedMedias({
    req,
    res,
    next,
    model: User,
    match: {
      _id: new Types.ObjectId(req.params.id)
    },
    dataKey: "followers"
  });

export const follow = async (req, res, next) => {
  try {
    if (req.user.id === req.params.userId)
      throw createError("You can't follow yourself");
    await User.updateOne(
      {
        _id: req.user.id
      },
      {
        $addToSet: {
          following: req.params.userId
        }
      }
    );
    await User.updateOne(
      {
        _id: req.params.userId
      },
      {
        $addToSet: {
          followers: req.user.id
        }
      }
    );
    res.json("Successfully followed user");
    sendAndUpdateNotification({
      req,
      type: "follow"
    });
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

export const unfollow = async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id)
      throw createError("You can't unfollow yourself");
    await User.updateOne(
      { _id: req.user.id },
      {
        $pull: {
          following: new Types.ObjectId(req.params.userId)
        }
      }
    );

    await User.updateOne(
      { _id: req.params.userId },
      {
        $pull: {
          followers: new Types.ObjectId(req.user.id)
        }
      }
    );
    res.json("Successfully unfollowed user");
    sendAndUpdateNotification({
      req,
      type: "follow",
      filter: true
    });
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    if (req.cookies.access_token) verifyToken(req);
    const f = await getAll({
      query: req.query,
      match: await createVisibilityQuery({
        userId: req.params.id,
        searchUser: req.user?.id,
        withSearchUser: req.user && req.user.id !== req.params.id
      }),
      model: Post,
      populate: {
        path: "user",
        select: req.query.user_select
      }
    });
    res.json(f);
  } catch (err) {
    next(err);
  }
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
          $ne: new Types.ObjectId(req.user.id),
          $nin: recommendationBlacklist.concat(following)
        }
      },
      query: req.query,
      t: true
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
            result.data.map(({ id }) => new Types.ObjectId(id))
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
    if (io) io.volatile.emit("update-user", user);
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
          await Notification.updateOne(
            { _id: activeId },
            {
              marked: true
            }
          );
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
  try {
    if (req.cookies.access_token) verifyToken(req);
    const start = new Date();
    start.setDate(start.getDate() - (Number(req.query.date) || 1));
    res.json(
      await getAll({
        match: await createVisibilityQuery({
          userId: req.params.id,
          searchUser: req.user?.id,
          query: {
            createdAt: {
              $gt: start
            }
          }
        }),
        model: Short,
        populate: {
          path: "user",
          select: req.query.user_select
        }
      })
    );
  } catch (err) {
    next(err);
  }
};

export const blacklistUserRecommendation = async (req, res, next) => {
  try {
    await User.updateOne(
      {
        _id: req.user.id
      },
      {
        $addToSet: {
          recommendationBlacklist: req.params.userId
        }
      }
    );
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
  try {
    const result = await getAll({
      match: {
        _id: new Types.ObjectId(req.user.id)
      },
      model: User,
      dataKey: "recommendationBlacklist"
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const whitelistUsers = async (req, res, next) => {
  try {
    Array.isArray(req.body) &&
      (await User.updateOne(
        {
          _id: req.user.id
        },
        {
          recommendationBlacklist: req.body
        }
      ));
    setTimeout(() => res.json("Whitelisted users successfully"), 4000);
  } catch (err) {
    next(err);
  }
};
