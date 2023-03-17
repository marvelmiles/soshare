import User from "../models/User.js";
import Post from "../models/Post.js";
import Short from "../models/Short.js";
import { getAll, createVisibilityQuery } from "../utils/index.js";
import { verifyToken } from "./auth.js";
export const search = async (req, res, next) => {
  try {
    console.log("getting search result..", req.query);
    const result = {};
    if (req.query.q) {
      const search = {
        $regex: req.query.q,
        $options: "i"
      };
      await verifyToken(
        req,
        {
          _noNext: true,
          throwErr: false
        },
        next
      );
      for (let key of (req.query.select || "posts users shorts").split(" ")) {
        switch (key) {
          case "posts":
            result.posts = await getAll({
              model: Post,
              match: createVisibilityQuery(req.user.id, undefined, undefined, {
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
              }),
              populate: [
                {
                  path: "user"
                }
              ]
            });
            continue;
          case "users":
            result.users = await getAll({
              model: User,
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
            });
            continue;
          case "shorts":
            result.shorts = await getAll({
              model: Short,
              match: {
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
            });
            continue;
          default:
            continue;
        }
      }
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};
