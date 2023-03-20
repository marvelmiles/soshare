import React, { useRef, useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import ThreadCard from "components/comments/ThreadCard";
import ToolBox from "components/ToolBox";
import PostWidget from "components/PostWidget";
import InfiniteScroll from "../InfiniteScroll";
import { useContext } from "redux/store";
import { useSelector } from "react-redux";
import { removeFirstItemFromArray } from "utils";
import useForm from "hooks/useForm";
import http from "api/http";
import InputBox from "../InputBox";
import Typography from "@mui/material/Typography";

const Comments = ({
  documentId,
  limit = 10,
  searchParams,
  setThread,
  autoFetchReplies = false,
  stateRef,
  handleAction,
  showRepliesBtn = true,
  showEndElement,
  docType,
  user,
  isAuth
}) => {
  const [showEnd, setShowEnd] = useState(showEndElement);
  const cid = useSelector(state => state.user.currentUser?.id);
  const { composeDoc, setSnackBar, socket } = useContext();
  const _stateRef = useRef({}).current;
  const [threadCard, setThreadCard] = useState({});
  const [showReplies, setShowReplies] = useState(autoFetchReplies);
  // console.log(docType, "ddd");
  const infiniteScrollRef = useRef();
  const appendComment = useCallback(
    (comment = _stateRef.cachedComment) => {
      if (docType) {
        console.log("reset input box...");
        setShowEnd(true);
      }
      const isDoc = documentId === comment.document.id;
      console.log("set new comment data ", isDoc, infiniteScrollRef.current);
      if (isDoc) {
        infiniteScrollRef.current.setData(prev => {
          if (_stateRef.length) return prev;
          if (!_stateRef.length) {
            _stateRef.length = comment.id;
          }
          return {
            ...prev,
            data: [comment, ...prev.data]
          };
        });
        handleAction("update", comment.document);
      } else if (infiniteScrollRef.current)
        infiniteScrollRef.current.setData(prev => ({
          ...prev,
          data: prev.data.map(_comment => {
            if (_comment.id === comment.document.id)
              return _comment.id === comment.document.id
                ? comment.document
                : _comment;
          })
        }));
    },
    [docType, documentId, handleAction, _stateRef]
  );
  const _handleAction = useCallback(
    (reason, res, cacheData) => {
      console.log("hand l com action", res);
      switch (reason) {
        case "new":
          if (docType) appendComment(res);
          setThread &&
            setThread(prev => {
              return { ...prev, [documentId]: true };
            });
          break;
        case "filter":
          console.log("filter dle");
          handleAction();
          // infiniteScrollRef.current.setData(prev => {
          //   const f = prev.data
          //     .filter((comment, i) => {
          //       if (comment.id === res) {
          //         handleAction("filter-comment", {
          //           uid: comment.user.id,
          //           docId: documentId
          //         });
          //         if (cacheData) _stateRef.cachedComment = comment;
          //         if (!(comment.document.comments.length - 1)) {
          //           if (docType) setShowEnd(false);
          //           setThread &&
          //             setThread(prev => {
          //               delete prev[comment.document.id];
          //               return { ...prev };
          //             });
          //         }

          //         return false;
          //       }
          //       return true;
          //     })
          //     .map(comment => {
          //       comment.document.comments = removeFirstItemFromArray(
          //         comment.user.id,
          //         comment.document.comments
          //       );
          //       return comment;
          //     });
          //   console.log(prev.data, f, "del");
          //   return {
          //     ...prev,
          //     data: f
          //   };
          // });
          break;
        case "filter-comment":
          infiniteScrollRef.current.setData(prev => {
            prev.data.find((comment, i) => {
              if (comment.id === res.docId) {
                comment.comments = removeFirstItemFromArray(
                  res.uid,
                  comment.comments
                );
                prev.data.splice(i, 1, comment);
                return true;
              }
              return false;
            });
            return {
              ...prev
            };
          });
          break;
        case "clear-cache":
          delete _stateRef.cachedComment;
          break;
        default:
          console.log("ypdating...");
          infiniteScrollRef.current.setData(prev => ({
            ...prev,
            data: prev.data.map(comment =>
              comment.id === res.id ? { ...comment, ...res } : comment
            )
          }));
          break;
      }
    },
    [handleAction, setThread, documentId, docType, appendComment, _stateRef]
  );
  useEffect(() => {
    socket.on("comment", ({ document }) => {
      _stateRef.length !== document.id && appendComment(document);
    });
    socket.on("delete-comment", (cid, docId) => {
      if (docId === documentId)
        infiniteScrollRef.current.setData({
          ...infiniteScrollRef.current.data,
          data: infiniteScrollRef.current.data.data.filter(
            ({ id }) => id !== cid
          )
        });
    });
    if (infiniteScrollRef.current && composeDoc && composeDoc.reason === "new")
      appendComment(composeDoc);
    // const timer = setInterval(() => {
    //   // infiniteScrollRef.current.setData(prev => ({
    //   //   ...prev
    //   // }));
    // }, 1000);
    return () => {
      // clearInterval(timer);
    };
  }, [composeDoc, appendComment, socket, documentId, _stateRef]);
  _stateRef.showReplies = showReplies;

  const toggleReplyBtn = (
    <button
      onClick={e => {
        e.stopPropagation();
        setShowReplies(!showReplies);
        setThread &&
          setThread(prev => {
            showReplies
              ? delete prev[documentId]
              : (prev = {
                  ...prev,
                  [documentId]: true
                });
            return { ...prev };
          });
        if (showReplies) setThreadCard({}); // reset children thread
      }}
    >
      {showReplies ? "hide replies" : "show replies"}
    </button>
  );

  if (infiniteScrollRef.current?.data.data.length && stateRef) {
    if (!stateRef[documentId]) stateRef[documentId] = {};
    stateRef[documentId].childData = infiniteScrollRef.current.data;
  }
  return (
    <Box>
      {docType ? (
        <InputBox
          withPlaceholders
          method="post"
          accept=".jpg,.jpeg,.png,.gif"
          placeholder="Send your opinion"
          actionText="Reply"
          mediaRefName="media"
          multiple={false}
          url={`/comments/new/${docType}`}
          max={280}
          placeholders={{
            document: documentId
          }}
          message={{
            success: `Added comment successfully`
          }}
          sx={{
            minHeight: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0
          }}
          handleAction={_handleAction}
        />
      ) : null}
      {autoFetchReplies === true || showReplies ? (
        <InfiniteScroll
          ref={infiniteScrollRef}
          searchParams={searchParams}
          limit={limit}
          url={`/comments/feed/${documentId}`}
          handleAction={_handleAction}
          defaultData={stateRef?.[documentId]?.childData}
          showEndElement={showEnd}
          httpConfig={
            isAuth && {
              withCredentials: true
            }
          }
          sx={{
            // border: "1px solid red",
            minHeight: "100px"
          }}
          root={document.documentElement}
        >
          {({ data: { data, paging }, setObservedNode }) => {
            // console.log(data, documentId, "dataddss");
            // return null;
            return (
              <>
                {showRepliesBtn ? toggleReplyBtn : null}
                {data.length ? (
                  data.map((comment, i) => {
                    const renderThreadOwners = () => {
                      if (comment.user.id === cid) return;
                      let str = comment.threads.length
                        ? "Replying to "
                        : `Replying to ${user.username ||
                            comment.document.user.username}`;
                      let shown = 0;
                      for (const thread of comment.threads) {
                        // console.log(thread, "sssss");
                        const {
                          user: { username, id },
                          document: {
                            user: { username: run, id: rid }
                          }
                        } = thread;
                        if (str.length > 140) {
                          str += ` ${comment.threads.length - shown} others.`;
                          break;
                        }
                        shown++;
                        str += ` ${username} and ${run}`;
                      }
                      return str;
                    };
                    return (
                      <div key={comment.id}>
                        <PostWidget
                          showThread={threadCard[comment.id]}
                          docType="comment"
                          post={
                            comment.id === composeDoc?.id ? composeDoc : comment
                          }
                          ref={
                            i === data.length - (data.length > 4 ? 3 : 1)
                              ? node => node && setObservedNode(node)
                              : null
                          }
                          handleAction={_handleAction}
                          caption={renderThreadOwners()}
                          isAuth={isAuth}
                        />
                        {showReplies === true ? (
                          <Comments
                            key={comment.id}
                            isAuth={isAuth}
                            documentId={comment.id}
                            limit={1}
                            searchParams={`query_op=relevant&limit=1&docType=${isAuth}`}
                            setThread={setThreadCard}
                            paging={paging}
                            stateRef={_stateRef}
                            handleAction={_handleAction}
                            showRepliesBtn={!!comment.comments.length}
                            showReplies={!!comment.comments.length}
                            showEndElement={false}
                            // user={comment.document.user}
                          />
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <Typography
                    variant="h6"
                    color="primary.dark"
                    textAlign="center"
                    sx={{
                      maxWidth: "320px",
                      mx: "auto",
                      mt: "64px"
                    }}
                  >
                    Looks like there are no comments yet. Be the first to share
                    your thoughts!
                  </Typography>
                )}
              </>
            );
          }}
        </InfiniteScroll>
      ) : (
        showRepliesBtn && toggleReplyBtn
      )}
    </Box>
  );
};

Comments.propTypes = {};

export default Comments;
