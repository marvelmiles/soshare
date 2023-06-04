import { useCallback, useState } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { CANCELED_REQUEST_MSG } from "context/config";
import { useSelector } from "react-redux";
export default (config = {}) => {
  const isLoggedIn = useSelector(state => !!state.user.currentUser);
  const { url, handleAction, httpConfig } = config;
  const [activeDelItem, setActiveDelItem] = useState("");
  const { setSnackBar } = useContext();
  const handleDelete = useCallback(
    async (_url, ids, opt = {}) => {
      if (!isLoggedIn) return setSnackBar();
      let i = 0;
      let errCount = 0;
      opt.label = `${opt.label || "selection"}${ids.length > 1 ? "s" : ""}`;
      for (let _id of ids) {
        setActiveDelItem(opt.activeItem || _id.id || _id);
        handleAction && handleAction("filter", { document: _id });
      }
      handleAction("close");
      for (let _id of ids) {
        const id = _id.id || _id;
        try {
          _url = _url || url;
          _url = _url.url
            ? _url.url + `/${id}?${_url.searchParams || ""}`
            : _url + `/${id}`;

          const t = await http.delete(_url, opt._httpConfig || httpConfig);

          handleAction && handleAction("clear-cache", { document: _id });
        } catch (message) {
          if (message === CANCELED_REQUEST_MSG) continue;
          else {
            errCount++;
            handleAction && handleAction("new", { document: _id });
          }
        } finally {
          i++;
          if (i === ids.length) setActiveDelItem("");
        }
      }
      if (errCount)
        setSnackBar(
          `Failed to delete${errCount > 1 ? " " + errCount : ""} ${opt.label}!`
        );
      else
        setSnackBar({
          message: `Deleted ${opt.label} successfully`,
          severity: "success"
        });
    },
    [url, httpConfig, handleAction, setSnackBar, isLoggedIn]
  );
  return {
    handleDelete,
    activeDelItem
  };
};
