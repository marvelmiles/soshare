import User from "../models/User.js";

export const validateBlacklist = async (user, userId) => {
  if (!user.email) user = await User.findById(user.id);

  if (
    user.recommendationBlacklist.includes(userId) ||
    user.blockedUsers.includes(userId)
  )
    throw "Failed to process request. User blacklisted!";

  return user;
};
