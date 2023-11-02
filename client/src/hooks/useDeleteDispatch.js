import { useCallback, useState } from "react";
import http from "api/http";
import { useContext } from "context/store";
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

      if (opt.loop === undefined ? true : opt.loop)
        for (let item of ids) {
          setActiveDelItem(opt.activeItem || item.id || item);
          handleAction && handleAction("filter", { document: item });
        }

      setActiveDelItem("");
      handleAction("close");

      for (let item of ids) {
        const id = item.id || item;
        try {
          let __url = _url || url;
          __url = __url.url
            ? __url.url + `/${id}?${__url.searchParams || ""}`
            : __url + `/${id}`;

          http.delete(__url, opt._httpConfig || httpConfig);
          handleAction && handleAction("clear-cache", { document: id });
        } catch (err) {
          if (!err.isCancelled) continue;
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
