import { Types } from "mongoose";
import { createError } from "./error.js";
import User from "../models/User.js";
import { HTTP_CODE_DOCUMENT_NOT_FOUND } from "../constants.js";

export const setPostText = post => {
  if (post.text?.length > 390) {
    post.moreText = post.text.slice(391, 700);
    post.text = post.text.slice(0, 391);
  }

  return post;
};

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

  setPostText(req.body);
};

export const createVisibilityQuery = async ({
  userId,
  searchUserId = userId,
  query = {},
  allowDefaultCase = false,
  fallbackVisibility = "everyone",
  searchUser,
  refPath = "user",
  withBlacklist = true,
  user: cUser,
  blacklistType = "all"
}) => {
  if (userId) {
    const user = searchUser || (await User.findById(searchUserId));

    if (!user)
      throw createError("User not found", 404, HTTP_CODE_DOCUMENT_NOT_FOUND);

    const isUser = user.id === userId;

    const _ref = `$${refPath}`;

    const blacklistCond = {};

    const getCUser = async () => cUser || (await User.findById(userId)) || {};

    if (withBlacklist) {
      cUser = await getCUser();

      const blackAll = blacklistType === "all";

      blacklistCond.$or = [
        {
          $in: [_ref, cUser.blockedUsers]
        },
        {
          $in: ["$_id", cUser.blockedUsers]
        }
      ];

      if (blackAll)
        blacklistCond.$or.splice(
          2,
          0,
          {
            $in: [_ref, cUser.recommendationBlacklist]
          },
          {
            $in: ["$_id", cUser.recommendationBlacklist]
          }
        );
    } else blacklistCond.$eq = [true, false];

    query.$expr = {
      $cond: {
        if: blacklistCond,
        then: false,
        else: {
          $cond: {
            if: { $eq: [{ $ifNull: ["$visibility", null] }, null] },
            then: true,
            else: {
              $cond: {
                if: { $eq: ["$visibility", "everyone"] },
                then: true,
                else: {
                  $cond: {
                    if: { $eq: ["$visibility", "private"] },
                    then: { $eq: [_ref, userId] },
                    else: {
                      $cond: {
                        if: { $eq: ["$visibility", "followers only"] },
                        then: {
                          $cond: {
                            if: {
                              $eq: ["$user", user.id]
                            },
                            then: {
                              $cond: {
                                if: {
                                  $eq: ["$user", userId]
                                },
                                then: true,
                                else: user.followers.includes(userId)
                              }
                            },
                            else: {
                              $cond: {
                                if: {
                                  $in: [
                                    _ref,
                                    isUser
                                      ? user.following
                                      : (await getCUser()).following || []
                                  ]
                                },
                                then: true,
                                else: false
                              }
                            }
                          }
                        },
                        else: allowDefaultCase
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
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
