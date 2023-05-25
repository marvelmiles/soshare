import rootAxios, { AxiosError } from "axios";
import {
  API_ENDPOINT,
  CANCELED_REQUEST_MSG,
  HTTP_403_MSG
} from "context/config";

let isRefreshing = false;
let requestQueue = [];

const cancelRequests = [];

export const createRelativeURL = (keyToRemove, searchParams = "") => {
  const params = new URLSearchParams(window.location.search);
  keyToRemove && params.delete(keyToRemove);
  return (
    window.location.pathname +
    "?" +
    params.toString() +
    (searchParams ? "&" + searchParams : "") +
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

export const getHttpErrMsg = err => {
  let message = "Something went wrong. Check your network and try again.";
  if (err instanceof AxiosError) {
    switch (err.code) {
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
  } else message = err;

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
    originalRequest.withCredentials &&
    originalRequest.method === method &&
    originalRequest.url !== "/auth/refresh-token"
  ) {
    originalRequest.withCredentials = false;
    originalRequest._refetchedHasVisitor = true;
    return Promise.resolve(http.request(originalRequest));
  }
  return Promise.reject(getHttpErrMsg(err));
};

export const handleRefreshToken = (requestConfig, refetchHasVisitior) => {
  isRefreshing = true;
  return http
    .get(`/auth/refresh-token`, {
      withCredentials: true
    })
    .then(res => {
      requestConfig && (requestConfig._refreshed = true);
      processQueue(null);
      return requestConfig
        ? http
            .request(requestConfig)
            .then(d => Promise.resolve(d))
            .catch(err => refetchHasVisitor(err, requestConfig))
        : Promise.resolve(res);
    })
    .catch(err => {
      err = getHttpErrMsg(err);
      processQueue(refetchHasVisitior ? "visitor" : err);
      return refetchHasVisitior
        ? refetchHasVisitor("visitor", requestConfig)
        : Promise.reject(err);
    })
    .finally(() => {
      isRefreshing = false;
    });
};
const http = rootAxios.create({
  baseURL: API_ENDPOINT + "/api"
});
http.interceptors.request.use(function(config) {
  /delete|put|post|patch/.test(config.method) &&
    (config.withCredentials = true);
  if (config.headers["authorization"]) config.withCredentials = true;
  const source = rootAxios.CancelToken.source(); // create new source token on every request
  source.url = config.url;
  config.cancelToken = source.token;
  cancelRequests.push(source);
  return config;
});
http.interceptors.response.use(
  response => Promise.resolve(response.data),
  async err => {
    // console.log(err.response?.data, err.message, err.code);
    if (!(err instanceof AxiosError) || rootAxios.isCancel(err))
      return Promise.reject(getHttpErrMsg(err));
    const originalRequest = err.config;
    if (!originalRequest._refreshed || !originalRequest._refetchedHasVisitor) {
      if (err.response?.status === 401 && !originalRequest._noRefresh) {
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
        } else if (originalRequest.withCredentials)
          return handleRefreshToken(originalRequest, true);
      }
    }
    originalRequest._refreshed = undefined;
    originalRequest._refetchedHasVisitor = undefined;
    return Promise.reject(getHttpErrMsg(err));
  }
);

export default http;
