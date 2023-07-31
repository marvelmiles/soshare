import { useRef } from "react";
import { checkVisibility } from "utils/validators";
import { updateUser } from "context/slices/userSlice";
import { useDispatch } from "react-redux";

// functions that requires redux with no extra state or hooks
const useCallbacks = (infiniteScrollRef, currentUser) => {
  const dispatch = useDispatch();

  const ref = useRef({
    registeredIds: {},
    _handleAction: (reason, options = {}) => {
      const { document, uid, action, value } = options;
      const { setData, data } = infiniteScrollRef.current;
      const docId = document && (document.id || document);
      if (docId ? ref.current.registeredIds[docId] : ref.current.isProc) return;

      if (docId) ref.current.registeredIds[docId] = true;
      else ref.current.isProc = true;

      ref.current.isProc = true;
      switch (reason) {
        case "new":
          let _data = data.data.slice();
          (document.visibility
            ? checkVisibility(document, currentUser)
            : true) && (_data = [document, ...data.data]);

          setData(
            { ...data, data: _data },
            {
              numberOfEntries: document.user?.id === currentUser.id ? 0 : 1
            }
          );

          break;
        case "filter":
          setData(
            {
              ...data,
              data: data.data.filter((doc, index) => {
                if (doc.id === docId || (doc.user && doc.user.id === uid))
                  return false;

                return true;
              })
            },
            {
              exclude: docId
            }
          );
          break;
        case "clear-cache":
          break;
        case "update":
          setData({
            ...data,
            data: data.data.map(s =>
              s.id === docId || (uid && s.user?.id === uid)
                ? { ...s, ...document }
                : s
            )
          });
          break;
        case "checked":
          dispatch(
            updateUser({
              key: "settings",
              value: {
                [action]: value
              }
            })
          );
          break;
        default:
          break;
      }
      if (docId) delete ref.current.registeredIds[docId];
      else ref.current.isProc = false;
    }
  });
  return ref.current;
};

export default useCallbacks;
