import { useState, useCallback } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { useSelector } from "react-redux";

export default ({ handleAction, document = {}, docType }) => {
  const { id, likes = {}, rootThread } = document;
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const { setSnackBar, setContext } = useContext();
  const cid = useSelector(state => (state.user.currentUser || {}).id);
  const handleLikeToggle = useCallback(
    async e => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const likedDoc = likes[cid];
      const url = `/${docType}s/${id}/${likedDoc ? "dislike" : "like"}`;
      if (cid) {
        try {
          setIsProcessingLike(true);
          if (likedDoc) delete likes[cid];
          else likes[cid] = true;
          handleAction &&
            handleAction("update", { document: { id, likes, rootThread } });

          await http.patch(url);
        } catch (err) {
          !err.isCancelled && setSnackBar(err.message);

          if (likedDoc) likes[cid] = true;
          else delete likes[cid];
          handleAction &&
            handleAction("update", { document: { id, likes, rootThread } });
        } finally {
          setIsProcessingLike(false);
        }
      } else {
        const _likes = {
          ...likes,
          [cid]: true
        };
        setContext(prev => ({
          ...prev,
          composeDoc: {
            url,
            docType,
            reason: "request",
            method: "patch",
            document: {
              id,
              likes: _likes,
              rootThread
            },
            onSuccess: () => ({
              likes: _likes
            }),
            onError() {
              delete _likes[cid];
              return {
                likes: _likes
              };
            }
          }
        }));
        setSnackBar();
      }
    },
    [docType, handleAction, id, likes, rootThread, setSnackBar, cid, setContext]
  );

  return {
    handleLikeToggle,
    isProcessingLike
  };
};
