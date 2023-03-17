import rootAxios from "axios";
import { API_ENDPOINT } from "config";

let isRefreshing = false;
let failedQueue = [];

export const createRedirectURL = (path = "/auth/signin", searchParam = "") => {
  return (
    window.location.protocol +
    "//" +
    window.location.host +
    path +
    (window.location.search +
      `?redirect_url=${encodeURIComponent(
        window.location.href
      )}${searchParam}`) +
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
  let message = "Something went wrong. Check your network and try again.";
  switch (err.code) {
    case "auth/popup-closed-by-user":
      message = "Popup closed by you";
      break;
    default:
      if (err.response) {
        if (err.response.status !== 500) message = err.response.data;
      } else if (err.status !== 500) message = err.message;
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
  baseURL: API_ENDPOINT + "/api"
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
      err.response?.status,
      " rootAxios err url "
    );
    const originalRequest = err.config;
    const handleErr403 = err => {
      if (window.location.pathname.toLowerCase().indexOf("auth/signin") > -1)
        return Promise.reject(getHttpErrMsg(err));
      window.location.href = createRedirectURL();
    };
    if (err.response?.status === 401) {
      console.log("401...");
      if (!(originalRequest._retry || originalRequest._queued)) {
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
            })
            .then(() => {
              console.log("has set new jwtToken ", originalRequest);
              processQueue(null);
              return resolve(http.request(originalRequest));
            })
            .catch(handleErr403);
        });
      } else
        console.log(
          "reject cos  queued or retrying",
          originalRequest.role,
          originalRequest._retry,
          originalRequest._queued
        );
    } else if (err.response?.status === 403) handleErr403(err);
    else {
      console.log("default error");
      return Promise.reject(getHttpErrMsg(err));
    }
  }
);

export default http;
