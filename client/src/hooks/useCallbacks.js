import { useRef } from "react";
import { checkVisibility } from "utils/validators";
import { updateUser } from "context/slices/userSlice";
import { useDispatch } from "react-redux";

// functions that requires redux with no extra state or hooks
const useCallbacks = (infiniteScrollRef, { currentUser = { user: {} } }) => {
  const dispatch = useDispatch();

  const ref = useRef({
    _handleAction: (reason, options = {}) => {
      const { document, uid, action, value } = options;
      const { setData, data } = infiniteScrollRef.current;
      const docId = document && (document.id || document);
      if (ref.current.isProc) return;
      switch (reason) {
        case "new":
          ref.current.isProc = true;
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
          ref.current.isProc = true;
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
              exclude: [docId]
            }
          );
          break;
        case "clear-cache":
          ref.current.isProc = true;
          break;
        case "update":
          ref.current.isProc = true;
          setData({
            ...data,
            data: data.data.map(s =>
              s.id === docId || s.user?.id === uid ? { ...s, ...document } : s
            )
          });
          break;
        case "checked":
          ref.current.isProc = true;
          dispatch(
            updateUser({
              settings: {
                [action]: value
              }
            })
          );
          break;
        default:
          break;
      }
      ref.current.isProc = false;
    }
  });
  return ref.current;
};

export default useCallbacks;
