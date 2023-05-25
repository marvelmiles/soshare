import { isObject } from "./validators.js";
import { findThreadByRelevance } from "./index.js";
import { Types } from "mongoose";
import { createError } from "./error.js";
import User from "../models/User.js";

export const mergeThread = async (model, doc, query = {}, populate) => {
  const relevanceConfig = {
    model,
    docId: doc,
    populate,
    query
  };
  if (!isObject(doc)) {
    doc = await findThreadByRelevance(relevanceConfig);
    if (!doc) return null;
  }
  const maxThread = query.maxThread
    ? Number(query.maxThread) || 0
    : query.thread
    ? 1
    : 0;
  let depth = 0;
  if (maxThread) {
    const merge = async doc => {
      let thread;
      do {
        relevanceConfig.docId = doc.id;
        thread = await findThreadByRelevance(relevanceConfig);
        if (thread) doc.threads = thread;
        depth++;
      } while (thread && maxThread > depth && (doc = thread));
    };
    await merge(doc);
  }

  doc.threadDepth = depth;
  return doc;
};

export const createVisibilityQuery = async ({
  userId,
  searchUser,
  searchRef,
  query = {},
  followers = [],
  following = [],
  recommendationBlacklist = [],
  withSearchUser,
  withBlacklist = true,
  withFallbackVisibility = true
}) => {
  if (userId || followers.length || following.length) {
    const user = userId
      ? await User.findById(userId)
      : { followers, following, recommendationBlacklist };
    if (!user) throw createError("User doesn't exist", 404);
    const bool = searchUser === userId;
    (withSearchUser || bool) && (query.user = userId);
    if (!bool) {
      const isUserProp = { $eq: ["$user", userId] };
      query.$expr = {
        $cond: {
          if: {
            $in: ["$user", withBlacklist ? user.recommendationBlacklist : []]
          },
          then: false,
          else: {
            $cond: {
              if: { $eq: ["$visibility", "everyone"] },
              then: true,
              else: {
                $cond: {
                  if: { $eq: ["$visibility", "private"] },
                  then: isUserProp,
                  else: {
                    $cond: {
                      if: { $eq: ["$visibility", "followers only"] },
                      then: withSearchUser
                        ? user.followers.includes(searchUser) || isUserProp
                        : {
                            $or: [
                              isUserProp,
                              {
                                $in: [
                                  "$user",
                                  user.following.map(
                                    id => new Types.ObjectId(id)
                                  )
                                ]
                              }
                            ]
                          },
                      else: withFallbackVisibility ? false : true
                    }
                  }
                }
              }
            }
          }
        }
      };
    }
  } else if (withFallbackVisibility) query.visibility = "everyone";

  if (searchRef) {
    if (!query.$or) query.$or = [];
    query.$or.push({
      _id: searchRef
    });
    query.$or.push({
      visibility: "everyone"
    });
  }

  return query;
};
