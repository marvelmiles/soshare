import { useRef } from "react";
import { checkVisibility } from "utils/validators";
import { updateUser } from "context/slices/userSlice";
import { useDispatch } from "react-redux";

const useCallbacks = (infiniteScrollRef, { stateCtx, currentUser }) => {
  const dispatch = useDispatch();
  if (stateCtx && !stateCtx.registeredIds) {
    stateCtx.cachedData = {};
    stateCtx.registeredIds = {};
  }
  const ref = useRef({
    _handleAction: (reason, options = {}) => {
      // using cursor based traversing to avoid duplicate and inc. speed
      // compared to loops and filter hoc. just exploring alternatives
      // anyway... :)

      const { document, uid, cacheData = true, action, value } = options;
      const { setData, data } = infiniteScrollRef.current;
      const docId = document && (document.id || document);
      const inDOM = stateCtx.registeredIds[docId] >= -1;

      switch (reason) {
        case "new":
          console.log(" in view ");
          stateCtx.registeredIds[docId] = data.data.length;
          if (inDOM || !checkVisibility(document, currentUser)) {
            stateCtx.registeredIds[docId] = undefined;
            return;
          }
          let _data = data.data.slice();
          if (stateCtx.cachedData[docId]) {
            _data.splice(
              stateCtx.cachedData[docId].index,
              0,
              stateCtx.cachedData[docId].data
            );
            delete stateCtx.cachedData[docId];
          } else _data = [document, ...data.data];
          setData({ ...data, data: _data });
          break;
        case "filter":
          if (!inDOM) return;
          const handleDelete = (doc, index) => {
            delete stateCtx.registeredIds[doc.id];
            arr.splice(index, 1);
            cacheData &&
              (stateCtx.cachedData[doc.id] = {
                index,
                data: doc
              });
          };
          const arr = data.data.slice();
          let index = stateCtx.registeredIds[docId];
          let doc = data.data[index];
          if (uid) {
            for (const key in stateCtx.registeredIds) {
              index = stateCtx.registeredIds[key];
              doc = data.data[index];
              if (doc && doc.user.id === uid) handleDelete(doc, index);
            }
          } else handleDelete(doc, index);

          return setData(
            {
              ...data,
              data: arr
            },
            {
              exclude: [docId]
            }
          );
        case "clear-cache":
          delete stateCtx.cachedData[docId];
          break;
        case "update":
          return setData({
            ...data,
            data: data.data.map(s =>
              s.id === docId ? { ...s, ...document } : s
            )
          });
        case "checked":
          dispatch(
            updateUser({
              settings: {
                [action]: value
              }
            })
          );
          return;
        default:
          break;
      }
    }
  });
  return ref.current;
};

export default useCallbacks;
