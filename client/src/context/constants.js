export const isProdMode = process.env.NODE_ENV === "production";

export const SERVER_ORIGIN = isProdMode
  ? "https://soshare.onrender.com"
  : "http://localhost:8800";

export const HTTP_CANCELLED_MSG = "Request was canceled";

export const HTTP_403_MSG = "Access denied!";

export const PAUSE_MEDIA_PLAYBACK = "PAUSE_MEDIA_PLAYBACK";

export const HTTP_401_MSG = "Authorization credentials is invalid";

export const HTTP_DEFAULT_MSG = "Something went wrong!";

export const HTTP_CODE_INVALID_USER_ACCOUNT = "INVALID_USER_ACCOUNT";

export const HTTP_CODE_TIMEDOUT = "REQUEST_TIMEDOUT";

export const HTTP_CODE_USER_BLACKLISTED = "USER_BLACKLISTED";

export const HTTP_CODE_DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND";

export const HTTP_MSG_VERIFICATION_MAIL =
  "Verification mail isn't registered to an account.";

export const anchorAttrs = {
  target: "_blank",
  rel: "noopener noreferrer"
};
