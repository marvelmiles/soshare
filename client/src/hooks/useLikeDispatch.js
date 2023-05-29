import { useState, useCallback } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
export default ({ handleAction, document = {}, docType }) => {
  const { id, likes = {}, rootThread } = document;
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const { setSnackBar } = useContext();
  const cid = useSelector(state => (state.user.currentUser || {}).id);
  const handleLikeToggle = useCallback(
    async e => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (cid) {
        const likedDoc = likes[cid];
        try {
          setIsProcessingLike(true);
          if (likedDoc) delete likes[cid];
          else likes[cid] = true;
          handleAction && handleAction("update", { id, likes, rootThread });
          await http.patch(
            `/${docType}s/${id}/${likedDoc ? "dislike" : "like"}`
          );
        } catch (message) {
          if (likedDoc) likes[cid] = true;
          else delete likes[cid];
          handleAction && handleAction("update", { id, likes, rootThread });
          setSnackBar(message);
        } finally {
          setIsProcessingLike(false);
        }
      } else setSnackBar();
    },
    [docType, handleAction, id, likes, rootThread, setSnackBar, cid]
  );

  return {
    handleLikeToggle,
    isProcessingLike
  };
};
