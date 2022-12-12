import jwt from "jsonwebtoken";
// refresh token don't need to be stored
// since this api is meant for a specific usage
export const setTokens = async (res, id) => {
  res
    .cookie(
      "access_token",
      jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30m"
      }),
      {
        httpOnly: true
      }
    )
    .cookie(
      "refresh_token",
      jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
      }),
      {
        httpOnly: true
      }
    );
};

// Rm duplice: group by _id and project a new root of the first document
// only which will verify no document is returned twice.
export const getAll = async ({ Collection, match, populate, size = 40 }) => {
  const result = await Collection.aggregate([
    {
      $match: match
    },
    { $sample: { size: size } },
    {
      $group: {
        _id: "$_id",
        result: { $push: "$$ROOT" }
      }
    },
    {
      $replaceRoot: {
        newRoot: { $first: "$result" }
      }
    }
  ]);
  if (populate) await Collection.populate(result, populate);
  return result;
};
