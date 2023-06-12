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
      for (let item of ids) {
        setActiveDelItem(opt.activeItem || item.id || item);
        handleAction && handleAction("filter", { document: item });
      }
      setActiveDelItem("");
      handleAction("close");
      for (let item of ids) {
        const id = item.id || item;
        try {
          _url = _url || url;
          _url = _url.url
            ? _url.url + `/${id}?${_url.searchParams || ""}`
            : _url + `/${id}`;

          await http.delete(_url, opt._httpConfig || httpConfig);
          handleAction && handleAction("clear-cache", { document: id });
        } catch (message) {
          if (message === CANCELED_REQUEST_MSG) continue;
          else {
            errCount++;
            handleAction && handleAction("new", { document: item });
          }
        } finally {
          i++;
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
    activeDelItem,
    isProcessingDelete: !!activeDelItem
  };
};
