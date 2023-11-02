export const HTTP_CODE_INVALID_USER_ACCOUNT = "INVALID_USER_ACCOUNT";

export const isProdMode = process.env.NODE_ENV === "production";

export const HTTP_MSG_INVALID_ACC_CRED = "Account credentials is invalid!";

export const CLIENT_ORIGIN = isProdMode ? "" : "http://localhost:3000";

export const COOKIE_KEY_ACCESS_TOKEN = "access_token";

export const COOKIE_KEY_REFRESH_TOKEN = "refresh_token";

export const SESSION_COOKIE_DURATION = {
  shortLived: {
    duration: 5,
    type: "m"
  },
  accessToken: {
    duration: 1,
    type: "m"
  },
  refreshToken: {
    extend: 28,
    duration: 1,
    type: "d"
  }
};

export const cookieConfig = {
  httpOnly: true,
  sameSite: "Strict",
  secure: isProdMode
};
