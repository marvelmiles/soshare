import { useCallback, useState } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { CANCELED_REQUEST_MSG } from "context/config";
import { useSelector } from "react-redux";
export default (config = {}) => {
  const isLoggedIn = useSelector(state => !!state.user.currentUser);
  const { url, handleAction, httpConfig } = config;
  const [isProcessingWhitelist, setIsProcessingWhitelist] = useState(false);
  const { setSnackBar } = useContext();
  const handleWhitelist = async (
    whitelist,
    { _url = `/users/whitelist`, dataSize, _handleAction }
  ) => {
    _url = _url || url;
    _handleAction = _handleAction || handleAction;
    if (isLoggedIn) {
      try {
        setIsProcessingWhitelist(true);
        if (_handleAction) {
          _handleAction("context", {
            processing: "Updating"
          });
          _handleAction("filter", whitelist);
          setIsProcessingWhitelist(false);
          _handleAction &&
            _handleAction("context", {
              processing: undefined,
              dataSize
            });
        }
        setSnackBar({
          message: await http.patch(_url, whitelist, httpConfig),
          severity: "success"
        });
        _handleAction && _handleAction("clear-cache", whitelist);
      } catch (message) {
        setSnackBar(message);
        if (message !== CANCELED_REQUEST_MSG)
          _handleAction && _handleAction("new", whitelist);
      } finally {
        _handleAction &&
          _handleAction("context", {
            processing: undefined,
            dataSize
          });
      }
    } else setSnackBar();
  };

  return {
    handleWhitelist,
    isProcessingWhitelist,
    isLoggedIn
  };
};
