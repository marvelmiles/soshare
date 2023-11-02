import rootAxios from "axios";
import {
  API_ORIGIN,
  HTTP_CANCELLED_MSG,
  HTTP_403_MSG,
  HTTP_401_MSG
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
    if (err) prom.reject({ err, config: prom.requestConfig });
    else prom.resolve({ data, config: prom.requestConfig });
  });
  requestQueue = [];
};

export const getHttpErrMsg = err => {
  return err.response ? err.response.data : err;
};

export const isTokenCancelled = rootAxios.isCancel;

export const handleCancelRequest = (url, msg = HTTP_CANCELLED_MSG) => {
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

export const refetchHasVisitor = async (
  requestConfig,
  err = "",
  method = "get"
) => {
  const _err = getHttpErrMsg(err);

  if (
    requestConfig &&
    (!requestConfig._refetchedHasVisitor &&
      requestConfig.method === method &&
      requestConfig.url !== "/auth/refresh-token")
  ) {
    requestConfig.withCredentials = false;
    requestConfig._refetchedHasVisitor = true;
    try {
      return await http.request(requestConfig);
    } catch (err) {
      return Promise.reject(getHttpErrMsg(err));
    }
  }
  return Promise.reject(_err);
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
      return requestConfig ? http.request(requestConfig) : res;
    })
    .catch(err => {
      let refetch = refetchHasVisitior && requestConfig;

      if (typeof err !== "string")
        err.message = refetch ? HTTP_401_MSG : HTTP_403_MSG;

      processQueue(err);

      return refetchHasVisitor(requestConfig, err);
    })
    .finally(() => {
      isRefreshing = false;
    });
};

const http = rootAxios.create({
  baseURL: API_ORIGIN + "/api"
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
    if (rootAxios.isCancel(err))
      return Promise.reject((err.isCancelled = true) && err);

    if (err.response?.status === 401) {
      requestConfig._isT && console.log("has 401 ", isRefreshing);
      requestConfig._retryCount++;
      if (isRefreshing) {
        requestConfig._isT && console.log("is refre ", requestConfig.url);
        return new Promise(function(resolve, reject) {
          requestQueue.push({ resolve, reject, requestConfig });
        })
          .then(({ config }) =>
            http
              .request(config)
              .then(res => res)
              .catch(err => refetchHasVisitor(config, err))
          )
          .catch(({ config, err }) => refetchHasVisitor(config, err));
      } else if (requestConfig.withCredentials && !requestConfig._noRefresh)
        return handleRefreshToken(requestConfig);
    }

    return Promise.reject(getHttpErrMsg(err, requestConfig?._isT));
  }
);

export default http;
