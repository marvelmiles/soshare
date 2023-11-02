import { useState, useCallback } from "react";
import { useContext } from "context/store";
import http from "api/http";
import { updateUser } from "context/slices/userSlice";
import { useDispatch } from "react-redux";
import { mapToObject } from "utils";

const useContextDispatch = (config = {}) => {
  const { handleAction } = config;

  const { setContext, setSnackBar, isLoggedIn } = useContext();

  const dispatch = useDispatch();

  const [activeMap, setActiveMap] = useState({});

  const handleContextKeyDispatch = useCallback(
    async (url, key, { username, id: uid, users, whitelist, setData }) => {
      const handleBlacklist = () => {
        dispatch(
          updateUser({
            key,
            value: mapToObject(uid ? [uid] : users),
            whitelist: !!whitelist
          })
        );
      };

      if (isLoggedIn) {
        try {
          setActiveMap(prev => {
            if (uid) prev[uid] = true;
            else
              for (const id of users) {
                prev[id] = true;
              }
            return {
              ...prev
            };
          });

          handleBlacklist();

          await http.patch(url, uid ? [uid] : users || []);

          if (whitelist) {
            setData(data => {
              return {
                ...data,
                data: uid ? data.data.filter(u => u.id !== uid) : []
              };
            });
            setActiveMap({});
          }
        } catch (err) {
          if (!err.isCancelled) {
            setActiveMap(prev => {
              if (uid) delete prev[uid];
              else
                for (const id of users) {
                  delete prev[id];
                }
              return {
                ...prev
              };
            });
            setSnackBar(
              `Failed to ${
                whitelist
                  ? "whitelist"
                  : {
                      disapprovedUsers: "disapprove",
                      blockedUsers: "block"
                    }[key]
              } ${
                username ? `@${username}` : users.length > 1 ? "users" : "user"
              }!`
            );
          }
        } finally {
          handleAction && handleAction("context", { action: "" });
        }
      } else {
        setContext(prev => ({
          ...prev,
          composeDoc: {
            url,
            reason: "request",
            method: "put",
            done: false,
            onSuccess() {
              handleBlacklist();
            }
          }
        }));

        setSnackBar();
      }
    },
    [isLoggedIn, setContext, setSnackBar, dispatch, handleAction]
  );

  return {
    activeMap,
    handleContextKeyDispatch
  };
};

export default useContextDispatch;
