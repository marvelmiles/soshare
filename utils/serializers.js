import { Types } from "mongoose";
import { createError } from "./error.js";
import User from "../models/User.js";

export const serializePostBody = (req, withErr = true) => {
  if (withErr && !(req.files.length || req.body.text))
    throw createError("Invalid body expect a file list or text key value");
  if (req.files.length)
    req.body.medias = req.files.map(f => ({
      id: new Types.ObjectId().toString(),
      url: f.publicUrl,
      mimetype: f.mimetype
    }));
  else req.body.medias = [];
  if (req.body.text?.length > 390) {
    req.body.moreText = req.body.text.slice(391, 700);
    req.body.text = req.body.text.slice(0, 391);
  }
};

export const createVisibilityQuery = async ({
  userId,
  searchUser,
  query = {},
  withBlacklist = true,
  allowDefaultCase = false,
  fallbackVisibility = "everyone",
  isVisiting,
  refPath = "user",
  verify
}) => {
  verify && console.log(userId, searchUser, " oop ");
  if (!userId && searchUser) {
    userId = searchUser;
    searchUser = undefined;
  }

  if (userId) {
    const user = await User.findById(userId);

    if (!user) throw createError("User doesn't exist", 404);

    const isUser = searchUser === userId;

    isVisiting = isVisiting === undefined ? userId && searchUser : isVisiting;

    (isVisiting || isUser) && (query[refPath] = userId);

    if (!isUser) {
      const _ref = `$${refPath}`;
      query.$expr = {
        $cond: {
          if: {
            $or: [
              {
                $in: [_ref, withBlacklist ? user.recommendationBlacklist : []]
              }
            ]
          },
          then: false,
          else: {
            $cond: {
              if: { $eq: [{ $ifNull: ["$visibility", null] }, null] },
              then: true,
              else: {
                if: { $eq: ["$visibility", "everyone"] },
                then: true,
                else: {
                  $cond: {
                    if: { $eq: ["$visibility", "private"] },
                    then: { $eq: [_ref, userId] },
                    else: {
                      $cond: {
                        if: { $eq: ["$visibility", "followers only"] },
                        then: searchUser
                          ? user.followers.includes(searchUser)
                          : { $in: [_ref, user.following] },
                        else: allowDefaultCase
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
    }
  } else query.visibility = fallbackVisibility;

  return query;
};
