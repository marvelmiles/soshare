import User from "../models/User.js";
import Post from "../models/Post.js";
import Short from "../models/Short.js";
import { getAll, getType } from "../utils/index.js";
import { createVisibilityQuery } from "../utils/serializers.js";
import { verifyToken } from "../utils/middlewares.js";
import mongoose from "mongoose";
import { createError } from "../utils/error.js";

export const search = async (req, res, next) => {
  try {
    const result = {};

    const search = req.query.q
      ? {
          $regex: req.query.q, // avoiding rgexp mmust be string err
          $options: "i"
        }
      : {
          $ne: ""
        };

    if (req.cookies.access_token) verifyToken(req);

    if (req.query.select && typeof req.query.select !== "string")
      throw createError(
        `Invalid request expect select query to be of type String got ${getType(
          req.query.select
        )}`
      );

    for (let key of (req.query.select || "posts users shorts").split(" ")) {
      switch (key) {
        case "posts":
          result.posts = await getAll({
            model: Post,
            query: req.query,
            match: await createVisibilityQuery({
              userId: req.user?.id,
              query: {
                $or: [
                  {
                    location: search
                  },
                  {
                    text: search
                  },
                  {
                    moreText: search
                  },
                  {
                    visibility: search
                  }
                ]
              }
            })
          });
          continue;
        case "users":
          result.users = await getAll({
            model: User,
            query: req.query,
            match: await createVisibilityQuery({
              userId: req.user?.id,
              query: {
                _id: {
                  $ne: req.user
                    ? new mongoose.Types.ObjectId(req.user.id)
                    : undefined
                },
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
            })
          });
          continue;
        case "shorts":
          result.shorts = await getAll({
            model: Short,
            query: req.query,
            match: await createVisibilityQuery({
              userId: req.user?.id,
              query: {
                $or: [
                  {
                    location: search
                  },
                  {
                    text: search
                  },
                  {
                    visibility: search
                  }
                ]
              }
            })
          });
          continue;
        default:
          result[key] = {
            data: [],
            paging: {
              nextCursor: null,
              matchedDocs: 0
            }
          };
          continue;
      }
    }
    res.json(result);
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};
