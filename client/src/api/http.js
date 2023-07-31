// verify
import rootAxios, { AxiosError } from "axios";
import {
  API_ENDPOINT,
  HTTP_CANCELLED_MSG,
  HTTP_403_MSG,
  HTTP_401_MSG,
  HTTP_DEFAULT_MSG
} from "context/constants";

let isRefreshing = false;
let requestQueue = [];

const cancelledMap = {};

export const createRelativeURL = (
  paramsToRemove = "",
  searchParams = "",
  replaceParamsMap,
  withPath = true
) => {
  const params = new URLSearchParams(window.location.search);

  if (replaceParamsMap)
    for (const param in replaceParamsMap) {
      const newParam = replaceParamsMap[param];
      if (window.location.search.indexOf(searchParams) === -1) {
        const val = params.get(param);
        val && params.set(newParam, val);
        params.delete(param);
      }
    }

  for (const key of paramsToRemove.split(" ")) {
    params.delete(key);
  }

  const search = params.toString();

  return `${withPath ? window.location.pathname : ""}?${search}${
    searchParams && search.indexOf(searchParams) === -1
      ? (search.length ? "&" : "") + searchParams
      : ""
  }${window.location.hash}`;
};

export const processQueue = (err, data) => {
  requestQueue.forEach((prom, i) => {
    if (err) prom.reject(err);
    else prom.resolve(data);
  });
  requestQueue = [];
};

export const getHttpErrMsg = (err, isT) => {
  isT && console.log(err);
  let message = HTTP_DEFAULT_MSG;
  if (err instanceof AxiosError) {
    switch (err.code?.toLowerCase()) {
      case "auth/popup-closed-by-user":
        message = "Popup closed by you";
        break;
      default:
        switch (err.response.status) {
          case 403:
            message = HTTP_403_MSG;
            break;
          case 401:
            message = HTTP_401_MSG;
            break;
          default:
            if (err.response.status !== 500)
              message = err.response.data || err.message || message;
            break;
        }
        break;
    }
  } else message = err.message || err;
  if (message.indexOf("Cast") > -1) message = HTTP_DEFAULT_MSG;

  return message;
};

export const isTokenCancelled = rootAxios.isCancel;

export const handleCancelRequest = (
  url = "paths",
  msg = HTTP_CANCELLED_MSG
) => {
  const handleCancel = key => {
    const source = cancelledMap[key];
    if (source) {
      source.cancel(msg);
      delete cancelledMap[key];
    }
  };
  if (url) handleCancel(url);
  else
    for (const key in cancelledMap) {
      handleCancel(key);
    }
};

export const refetchHasVisitor = (requestConfig, err = "", method = "get") => {
  if (
    requestConfig &&
    (!requestConfig._refetchedHasVisitor &&
      requestConfig.method === method &&
      requestConfig.url !== "/auth/refresh-token")
  ) {
    requestConfig.withCredentials = false;
    requestConfig._refetchedHasVisitor = true;
    return Promise.resolve(http.request(requestConfig));
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
        ? refetchHasVisitor(requestConfig, err)
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
  config.cancelToken = source.token;
  cancelledMap[config.url + (config._reqKey || "")] = source;
  config._retryCount = 0;
  return config;
});
http.interceptors.response.use(
  response => {
    const requestConfig = response.config;
    requestConfig._refetchedHasVisitor = undefined;

    return Promise.resolve(response.data);
  },
  async err => {
    const requestConfig = err.config;
    if (rootAxios.isCancel(err)) return Promise.reject("");
    if (err.response?.status === 401) {
      requestConfig._isT && console.log("has 401 ", isRefreshing);
      requestConfig._retryCount++;
      if (isRefreshing) {
        requestConfig._isT && console.log("is refre ");
        return new Promise(function(resolve, reject) {
          requestQueue.push({ resolve, reject, url: requestConfig.url });
        })
          .then(_ =>
            http
              .request(requestConfig)
              .then(res => Promise.resolve(res))
              .catch(err => refetchHasVisitor(requestConfig, err))
          )
          .catch(_err =>
            _err === "visitor"
              ? refetchHasVisitor(requestConfig, err)
              : Promise.reject(err)
          );
      } else if (requestConfig.withCredentials && !requestConfig._noRefresh)
        return handleRefreshToken(requestConfig);
    }

    return Promise.reject(getHttpErrMsg(err, requestConfig?._isT));
  }
);

export default http;
