import { useState } from "react";
import { useContext } from "context/store";
import http from "api/http";
import { updateUser } from "context/slices/userSlice";
import { useDispatch } from "react-redux";

const useContextDispatch = () => {
  const { setContext, setSnackBar, isLoggedIn } = useContext();

  const dispatch = useDispatch();

  const [activeMap, setActiveMap] = useState({});

  const handleContextKeyDispatch = async (
    url,
    key,
    { username, id: uid, users, whitelist, setData }
  ) => {
    const handleBlacklist = () => {
      const dispatchUpdate = uid => {
        whitelist &&
          setData(data => ({
            ...data,
            data: data.data.filter(d => d.id !== uid)
          }));

        dispatch(
          updateUser({
            key,
            value: whitelist ? uid : { [uid]: true },
            whitelist: !!whitelist
          })
        );
      };

      if (uid) dispatchUpdate(uid);
      else
        for (const uid of users) {
          dispatchUpdate(uid);
        }
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

        !whitelist && handleBlacklist();
        await http.patch(url, uid ? [uid] : users);
        whitelist && handleBlacklist();
      } catch (msg) {
        if (msg) {
          console.log(msg);
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
  };

  return {
    activeMap,
    handleContextKeyDispatch
  };
};

export default useContextDispatch;
