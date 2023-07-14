import rootAxios, { AxiosError } from "axios";
import {
  API_ENDPOINT,
  CANCELED_REQUEST_MSG,
  HTTP_403_MSG,
  TOKEN_EXPIRED_MSG
} from "context/config";

let isRefreshing = false;
let requestQueue = [];

const cancelRequests = [];

export const createRelativeURL = (
  keyToRemove,
  searchParams = "",
  withPath = true
) => {
  const params = new URLSearchParams(window.location.search);
  keyToRemove && params.delete(keyToRemove);
  const search = params.toString();
  return (
    (withPath ? window.location.pathname : "") +
    ("?" + search) +
    (searchParams ? (search.length ? "&" : "") + searchParams : "") +
    window.location.hash
  );
};

export const processQueue = (err, data) => {
  requestQueue.forEach((prom, i) => {
    if (err) prom.reject(err);
    else prom.resolve(data);
  });
  requestQueue = [];
};

export const getHttpErrMsg = (err, rejectAll) => {
  console.log(err);
  let message = "Something went wrong. Try again.";
  if (err instanceof AxiosError) {
    if (err.config) rejectAll = err.config.url === "/auth/reset-password";
    switch (err.code?.toLowerCase()) {
      case "auth/popup-closed-by-user":
        message = "Popup closed by you";
        break;
      default:
        if (err.response) {
          if (err.response.status === 403) message = HTTP_403_MSG;
          else if (err.response.status === 404) message = "404";
          else if (err.response.status !== 500)
            message = err.response.data || message;
        } else if (err.status !== 500) message = err.message || message;
        break;
    }
  } else message = err.message || err;

  if (message.indexOf("Cast") > -1) message = "Something went wrong!";
  if (!rejectAll && message === TOKEN_EXPIRED_MSG) message = "";

  return message;
};
export const isTokenCancelled = rootAxios.isCancel;
export const handleCancelRequest = (
  url = "paths",
  msg = CANCELED_REQUEST_MSG
) => {
  switch (url) {
    case "paths":
      for (let i = 0; i < cancelRequests.length; i++) {
        cancelRequests[i].cancel(msg);
      }
      break;
    default:
      url = cancelRequests.find(req => req.url === url);
      url && url.cancel(msg);
      break;
  }
};

export const refetchHasVisitor = (err, originalRequest, method = "get") => {
  if (
    !originalRequest._refetchedHasVisitor &&
    originalRequest.method === method &&
    originalRequest.url !== "/auth/refresh-token"
  ) {
    originalRequest.withCredentials = false;
    originalRequest._refetchedHasVisitor = true;
    return Promise.resolve(http.request(originalRequest));
  }
  return Promise.reject(getHttpErrMsg(err));
};

export const handleRefreshToken = (
  requestConfig,
  refetchHasVisitior = true
) => {
  isRefreshing = true;
  return http
    .get(`/auth/refresh-token`, {
      withCredentials: true
    })
    .then(res => {
      requestConfig && (requestConfig._refreshed = true);
      processQueue(null);
      return requestConfig ? http.request(requestConfig) : Promise.resolve(res);
    })
    .catch(err => {
      err = getHttpErrMsg(err);
      processQueue(err);
      return refetchHasVisitior && requestConfig
        ? refetchHasVisitor(err, requestConfig)
        : Promise.reject(err);
    })
    .finally(() => {
      isRefreshing = false;
    });
};
const http = rootAxios.create({
  baseURL: API_ENDPOINT + "/api"
});
let f;
http.interceptors.request.use(function(config) {
  /delete|put|post|patch/.test(config.method) &&
    (config.withCredentials = true);
  if (config.headers["authorization"]) config.withCredentials = true;
  const source = rootAxios.CancelToken.source(); // create new source token on every request
  source.url = config.url;
  config.cancelToken = source.token;
  cancelRequests.push(source);
  f = config.url;
  return config;
});
http.interceptors.response.use(
  response => Promise.resolve(response.data),
  async err => {
    if (!(err instanceof AxiosError) || rootAxios.isCancel(err)) {
      console.log(f, " cancelled url ");
      return Promise.reject(getHttpErrMsg(err));
    }
    const originalRequest = err.config;
    if (err.response?.status === 401) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          requestQueue.push({ resolve, reject, url: originalRequest.url });
        })
          .then(_ =>
            http
              .request(originalRequest)
              .then(res => Promise.resolve(res))
              .catch(err => refetchHasVisitor(err, originalRequest))
          )
          .catch(_err =>
            _err === "visitor"
              ? refetchHasVisitor(err, originalRequest)
              : Promise.reject(err)
          );
      } else if (originalRequest.withCredentials && !originalRequest._noRefresh)
        return handleRefreshToken(originalRequest);
    }

    originalRequest._refetchedHasVisitor = undefined;
    return Promise.reject(getHttpErrMsg(err));
  }
);

export default http;
