import { Types } from "mongoose";
import { createError } from "./error.js";
import User from "../models/User.js";
import { HTTP_CODE_DOCUMENT_NOT_FOUND } from "../constants.js";

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
  allowDefaultCase = false,
  fallbackVisibility = "everyone",
  isVisiting,
  refPath = "user",
  withBlacklist = true
}) => {
  if (!userId && searchUser) {
    userId = searchUser;
    searchUser = undefined;
  }

  if (userId) {
    const user = await User.findById(userId);

    if (!user)
      throw createError("User not found", 404, HTTP_CODE_DOCUMENT_NOT_FOUND);

    const isUser = searchUser === userId;

    (isVisiting || isUser) && (query[refPath] = userId);

    if (!isUser) {
      const _ref = `$${refPath}`;

      let blacklist = [];

      if (withBlacklist) {
        blacklist = user.recommendationBlacklist.concat(user.blockedUsers);

        if (isVisiting && searchUser) {
          const { recommendationBlacklist, blockedUsers } =
            (await User.findById(searchUser)) || {};

          blacklist = blacklist.concat(
            recommendationBlacklist || [],
            blockedUsers || []
          );
        }
      }
      query.$expr = {
        $cond: {
          if: {
            $or: [
              {
                $in: [_ref, blacklist]
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
  } else {
    query.$expr = {
      $cond: {
        if: {
          $eq: [{ $ifNull: ["$visibility", null] }, null]
        },
        then: true,
        else: {
          $eq: ["$visibility", fallbackVisibility]
        }
      }
    };
  }

  return query;
};
