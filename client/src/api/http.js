import rootAxios from "axios";
import { API_ENDPOINT } from "config";

let isRefreshing = false;
let failedQueue = [];

export const createRedirectURL = () => {
  return (
    window.location.host +
    "/auth/signin" +
    window.location.search +
    window.location.hash
  );
};

export const processQueue = (err, token) => {
  failedQueue.forEach(prom => {
    if (err) {
      prom.reject(err);
    } else prom.resolve(token);
  });
  failedQueue = [];
};

export const getHttpErrMsg = err => {
  let message = "";
  switch (err.code) {
    case "auth/popup-closed-by-user":
      message = "Popup closed by you";
      break;
    default:
      message =
        err.response?.data ||
        "Something went wrong. Check your network and try again.";
      break;
  }
  return message;
};

let cancelRequest = [];
export const isTokenCancelled = rootAxios.isCancel;
export const handleCancelRequest = (
  url = "pathname",
  msg = "Request was canceled"
) => {
  switch (url) {
    case "pathname":
      for (let i = 0; i < cancelRequest.length; i++) {
        cancelRequest[i].pathname === window.location.pathname &&
          cancelRequest[i].cancel(msg);
      }
      break;
    default:
      url = cancelRequest.find(req => req.url === url);
      url && url.cancel(msg);
      break;
  }
};
// You can setup  config for post and get with defualt authorization header
const http = rootAxios.create({
  baseURL: API_ENDPOINT
});
http.interceptors.request.use(function(config) {
  /delete|put|post|patch/.test(config.method) &&
    (config.withCredentials = true);
  if (config.headers["authorization"]) config.withCredentials = true;
  const source = rootAxios.CancelToken.source(); // create new source token on every request
  source.url = config.url;
  source.pathname = window.location.pathname;
  config.cancelToken = source.token;
  cancelRequest.push(source);
  return config;
});
http.interceptors.response.use(
  response => {
    return Promise.resolve(response.data);
  },
  async err => {
    if (rootAxios.isCancel(err)) return Promise.reject(err);

    console.log(
      err.code,
      err.status,
      err.message,
      err.response?.data,
      " rootAxios err url "
    );
    const originalRequest = err.config;
    if (originalRequest.noRefresh) return Promise.reject(getHttpErrMsg(err));
    else if (err.response?.status === 401) {
      console.log("401...");
      if (originalRequest._retry || originalRequest._queued) {
        console.log(
          "reject cos  queued or retrying",
          originalRequest.role,
          originalRequest._retry,
          originalRequest._queued
        );
        return Promise.reject("Encountered some error");
      }
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(_ => {
            originalRequest._queued = true;
            return http.request(originalRequest);
          })
          .catch(_ => {
            return Promise.reject(getHttpErrMsg(err));
          });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      console.log("is refre");
      return new Promise((resolve, reject) => {
        http
          .get(`/auth/refresh-token`, {
            withCredentials: true
            // headers: {
            //   "Content-Type": "application/json"
            // }
          })
          .then(() => {
            console.log("has set new jwtToken");
            processQueue(null);
            originalRequest.withCredentials = true;
            return resolve(http.request(originalRequest));
          })
          .catch(err => {
            processQueue(err);
            return reject(getHttpErrMsg(err));
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    } else if (err.response?.status === 403) {
      if (window.location.pathname.toLowerCase().indexOf("auth/signin") > -1)
        return Promise.reject(getHttpErrMsg(err));
      window.location.href = createRedirectURL();
    } else return Promise.reject(getHttpErrMsg(err));
  }
);

export default http;
