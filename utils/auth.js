import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const generateToken = () => crypto.randomBytes(20).toString("hex");

export const hashToken = async (token, rounds = 10) =>
  await bcrypt.hash(token, await bcrypt.genSalt(rounds));

export const setTokens = async (res, id, rememberMe, accessOnly) => {
  rememberMe = rememberMe === "true";

  const shortT = new Date();
  const longT = new Date();

  if (id) {
    shortT.setMinutes(shortT.getMinutes() + 30);

    if (rememberMe) longT.setDate(longT.getDate() + 28);
    else longT.setHours(longT.getHours() + 6);
  } else {
    shortT.setFullYear(1990);
    longT.setFullYear(1990);
  }

  res.cookie(
    "access_token",
    id
      ? jwt.sign(
          {
            id
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "10m"
          }
        )
      : "",
    {
      httpOnly: true,
      expires: shortT
    }
  );

  if (!accessOnly)
    res.cookie(
      "refresh_token",
      id
        ? JSON.stringify({
            jwt: jwt.sign(
              {
                id
              },
              process.env.JWT_SECRET,
              { expiresIn: "15m" }
            ),
            rememberMe
          })
        : "",
      {
        httpOnly: true,
        expires: longT
      }
    );
};
