import { Types } from "mongoose";
import { createError } from "./error.js";
import User from "../models/User.js";

export const _populateThreadsByRelevance = async (doc, query = {}, model) => {
  let { ro, threadPriorities = "ro,most comment", maxThread } = query;
  maxThread = maxThread ? Number(maxThread) || undefined : ro ? 1 : undefined;
  threadPriorities = threadPriorities.split(",");

  let refIndex = 0;

  const populate = [
    {
      path: "user"
    },
    {
      path: "document",
      populate: [
        {
          path: "user"
        },
        {
          path: "threads",
          populate: [
            { path: "user" },
            {
              path: "document",
              populate: [
                {
                  path: "user"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      path: "threads",
      populate: [
        { path: "user" },
        {
          path: "document",
          populate: [
            {
              path: "user"
            }
          ]
        }
      ]
    }
  ];

  while (refIndex < threadPriorities.length) {
    switch (threadPriorities[refIndex]) {
      case "ro":
        const prop = populate[populate.length - 1] || {};
        prop.match = {
          user: ro
        };
        populate[populate.length - 1] = prop;
        console.log(doc.threads);
        if (doc.populate) doc = await doc.populate(populate);
        else doc = await model.populate(doc, populate);
        doc.threads = doc.threads.slice(0, maxThread);
        return doc;
      case "most comment":
        if (doc.populate) doc = await doc.populate(populate);
        else doc = await model.populate(doc, populate);

        doc.threads = doc.threads
          .sort((a, b) => {
            return b.comments.length - a.comments.length;
          })
          .slice(0, maxThread);
        return doc;
      default:
        break;
    }
    refIndex++;
  }
  return doc;
};

export const populateThreadsByRelevance = async (doc, query = {}, model) => {
  let { ro, threadPriorities = "ro,most comment", maxThread } = query;
  maxThread = maxThread ? Number(maxThread) || undefined : ro ? 1 : undefined;
  threadPriorities = threadPriorities.split(",");

  let refIndex = 0;

  const populate = [
    {
      path: "user"
    },
    {
      path: "document",
      populate: [
        {
          path: "user"
        },
        {
          path: "threads",
          populate: [
            { path: "user" },
            {
              path: "document",
              populate: [
                {
                  path: "user"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      path: "threads",
      populate: [
        { path: "user" },
        {
          path: "document",
          populate: [
            {
              path: "user"
            }
          ]
        }
      ]
    }
  ];

  while (refIndex < threadPriorities.length) {
    switch (threadPriorities[refIndex]) {
      case "ro":
        const prop = populate[populate.length - 1] || {};
        prop.match = {
          user: ro
        };
        populate[populate.length - 1] = prop;
        console.log(doc.threads);
        await model
          .find({
            rootThread: doc.id,
            user: ro
          })
          .limit(maxThread);
        if (doc.populate) doc = await doc.populate(populate);
        else doc = await model.populate(doc, populate);
        doc.threads = doc.threads.slice(0, maxThread);

        return doc;
      case "most comment":
        if (doc.populate) doc = await doc.populate(populate);
        else doc = await model.populate(doc, populate);

        doc.threads = doc.threads
          .sort((a, b) => {
            return b.comments.length - a.comments.length;
          })
          .slice(0, maxThread);
        return doc;
      default:
        break;
    }
    refIndex++;
  }
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
