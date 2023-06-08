import React, { useRef, useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import PostWidget from "components/PostWidget";
import InfiniteScroll from "./InfiniteScroll";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import { removeFirstItemFromArray } from "utils";
import InputBox from "./InputBox";
import { Link } from "react-router-dom";
import { checkVisibility } from "utils/validators";
import EmptyData from "components/EmptyData";
import Loading from "components/Loading";

// decided to use index-based rendering
// scability and real-time updates
// splicing since array is mutable from infinite scroll :)

const Comments = ({
  documentId,
  limit,
  autoFetchReplies = true,
  context = {},
  handleAction,
  defaultShowEnd = true,
  docType,
  user,
  defaultData,
  isRO,
  sx,
  maxSizeElement,
  maxSize,
  rootUid = "",
  maxThread = 2,
  searchParams = `ro=${rootUid}&maxThread=${maxThread || ""}&withThread=true`,
  scrollNodeRef = null,
  infiniteProps
}) => {
  const currentUser = useSelector(state => state.user.currentUser || {});
  const {
    socket,
    context: { blacklistedUsers, filterDocsByUserSet }
  } = useContext();
  const stateRef = useRef({
    url: `/comments/feed/${documentId}`,
    registeredIds: {},
    pending: {},
    notiferDelay: -1,
    composeDoc: {}
  });
  const infiniteScrollRef = useRef();
  const appendComment = useCallback(
    comment => {
      const data = infiniteScrollRef.current?.data;
      const stateCtx = stateRef.current;
      const docId = comment.document.id;

      if (
        blacklistedUsers[comment.user.id] ||
        stateCtx.registeredIds[comment.id] >= -1 ||
        !(comment.rootThread
          ? data.data[stateCtx.registeredIds[comment.rootThread]] &&
            stateCtx.registeredIds[docId] > -1
          : docId === documentId) ||
        !checkVisibility(comment, currentUser)
      )
        return;

      console.log(" append ", comment.id, stateCtx.registeredIds[comment.id]);

      stateCtx.registeredIds[comment.id] = -1;

      stateRef.current.notifierDelay =
        comment.user.id === currentUser?.id ? -1 : undefined;

      if (docId === documentId) {
        stateCtx.registeredIds[comment.id] = data.data.length;
        infiniteScrollRef.current.setData({
          ...data,
          data: [comment, ...data.data]
        });
        handleAction &&
          handleAction("update", {
            document: comment.document
          });
      } else {
        const rIndex = stateCtx.registeredIds[comment.rootThread];
        let rootComment = data.data[rIndex];
        if (rootComment) {
          if (docId === rootComment.id) {
            rootComment = comment.document;
            stateCtx.registeredIds[comment.id] = 0;
            rootComment.threads[0] = comment;
          } else {
            const dIndex = stateCtx.registeredIds[docId];
            rootComment.threads[dIndex] = comment.document;
            if (rootComment.threads.length < maxThread) {
              rootComment.threads = rootComment.threads.slice(0, dIndex + 1);
              stateCtx.registeredIds[comment.id] = rootComment.threads.length;
              rootComment.threads.push(comment);
              stateRef.current.maxThread = dIndex + 1;
            }
          }
        }
        data.data[rIndex] = rootComment;
        infiniteScrollRef.current.setData({
          ...data
        });
      }
    },
    [currentUser, documentId, handleAction, maxThread, blacklistedUsers]
  );

  const removeComment = useCallback(
    ({ id, rootThread, document, user: { id: uid } }, cacheData = true) => {
      const stateCtx = stateRef.current;

      const data = infiniteScrollRef.current.data;
      const index = stateCtx.registeredIds[id];
      const docId = document.id;

      if (!(index > -1) || (!cacheData && isRO)) return;

      console.log(" deleted id ", id);

      cacheData &&
        document.comments &&
        (document.comments = removeFirstItemFromArray(uid, document.comments));

      const deleteFromReg = ({ id }) => delete stateCtx.registeredIds[id];

      if (docId === documentId) {
        data.data.splice(index, 1).forEach(deleteFromReg);
        handleAction && handleAction("update", { document });
      } else {
        const rIndex = stateCtx.registeredIds[rootThread];
        let rootComment = data.data[rIndex];
        const handleAnomaly = () => {
          // running just incase of multiple traffic collision maybe
          // based on dev and test it doesn't happen
          console.log(" anomaly ");
        };
        if (rootComment) {
          if (docId === rootThread) {
            rootComment.threads.forEach(deleteFromReg);
            rootComment.threads = [];
          } else {
            const dIndex = stateCtx.registeredIds[docId];
            if (dIndex > -1 && rootComment.threads[dIndex].id === docId) {
              if (typeof document.document === "string") {
                const _dIndex = stateCtx.registeredIds[document.document];
                document.document =
                  document.docType === "comment"
                    ? rootComment.threads[_dIndex]
                    : data.data[_dIndex];
              }
              rootComment.threads[dIndex] = document;

              rootComment.threads.splice(index).forEach(deleteFromReg);
            } else {
              console.log("anomaly....");
              handleAnomaly();
            }
          }
        } else handleAnomaly();

        data.data[rIndex] = rootComment;
      }

      infiniteScrollRef.current.setData({
        ...data
      });
    },
    [documentId, handleAction, isRO]
  );
  const _handleAction = useCallback(
    (reason, options = {}) => {
      const { document, cacheData = true, threadsOnly, uid } = options;
      const stateCtx = stateRef.current;
      switch (reason) {
        case "filter":
          removeComment(document, cacheData, threadsOnly);
          break;
        case "clear-cache":
          console.log("clear cahce ");
          delete stateCtx.registeredIds[document];
          break;
        case "update":
          const index = stateCtx.registeredIds[document.id];
          const data = infiniteScrollRef.current.data;
          document.threads = document.threads || [];
          if (document.rootThread) {
            const rIndex = stateCtx.registeredIds[document.rootThread];
            const rootComment = data.data[rIndex];
            const comment = rootComment.threads[index];
            rootComment.threads[index] = {
              ...comment,
              ...document,
              threads: [...comment.threads, ...document.threads]
            };
            data.data[rIndex] = rootComment;
          } else {
            if (index > -1) {
              data.data[index] = {
                ...data.data[index],
                ...document,
                threads: [
                  ...(data.data[index] || {}).threads,
                  ...document.threads
                ]
              };
            } else {
              data.data = data.data.map(comment =>
                comment.id === document.id
                  ? {
                      ...comment,
                      ...document,
                      threads: [...comment.threads, ...document.threads]
                    }
                  : comment
              );
            }
          }
          infiniteScrollRef.current.setData({
            ...data
          });
          break;
        default:
          break;
      }
    },
    [removeComment]
  );
  useEffect(() => {
    const handleFilter = comment => {
      console.log(" remove comment ");
      removeComment(comment, false);
    };

    const handleUpdate = comment => {
      _handleAction("update", {
        document: comment
      });
    };

    const handleAppend = (comment, replace) => {
      if (Array.isArray(comment)) {
        for (const _comment of comment) {
          appendComment(_comment, replace);
        }
      } else appendComment(comment, replace);
    };

    socket.on("comment", handleAppend);
    socket.on("update-comment", handleUpdate);
    socket.on("filter-comment", handleFilter);

    return () => {
      socket.removeEventListener("filter-comment", handleFilter);
      socket.removeEventListener("comment", handleAppend);
      socket.removeEventListener("update-comment", handleUpdate);
    };
  }, [appendComment, socket, removeComment, currentUser.id, _handleAction]);

  useEffect(() => {
    filterDocsByUserSet(
      infiniteScrollRef.current,
      blacklistedUsers,
      "threads",
      stateRef.current
    );
  }, [filterDocsByUserSet, blacklistedUsers]);

  // if (infiniteScrollRef.current?.data.data.length && stateCtx) {
  //   if (!stateCtx[documentId]) stateCtx[documentId] = {};
  //   stateCtx[documentId].childData = infiniteScrollRef.current.data;
  // }
  const getThreadOwners = c => {
    return "";
    if (!c || c.user.id === currentUser.id) return;
    let str = c.threads.length
      ? "Replying to "
      : `Replying to ${user.username || c.document.user.username}`;
    let shown = 0;
    // for (const thread of c.threads) {
    //   const {
    //     user: { username, id },
    //     document: {
    //       user: { username: run, id: rid }
    //     }
    //   } = thread;

    //   if (str.length > 140) {
    //     str += ` ${c.threads.length - shown} others.`;
    //     break;
    //   }
    //   shown++;
    //   str += ` ${username} and ${run}`;
    // }
    return str;
  };

  const renderSecAction = id => {
    return (
      <Button
        onClick={e => e.stopPropagation()}
        component={Link}
        to={`?view=comments&cid=${id}`}
      >
        show replies
      </Button>
    );
  };

  return (
    <>
      {docType ? (
        <InputBox
          withPlaceholders={false}
          submitInputsOnly={false}
          resetData={false}
          autoFocus={false}
          method="post"
          accept=".jpg,.jpeg,.png,.gif"
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
          key={documentId + "-comment-input-box"}
        />
      ) : null}
      {autoFetchReplies === true ? (
        <InfiniteScroll
          key={documentId + "comments"}
          className="comments"
          ref={infiniteScrollRef}
          searchParams={searchParams}
          limit={limit}
          url={stateRef.current.url}
          // defaultData={stateCtx?.[documentId]?.childData || defaultData}
          defaultShowEnd={defaultShowEnd}
          httpConfig={
            isRO && {
              withCredentials: true
            }
          }
          maxSizeElement={maxSizeElement}
          maxSize={maxSize}
          scrollNodeRef={scrollNodeRef}
          notifierDelay={stateRef.current.notifierDelay}
          notifierProps={{
            position: "fixed"
          }}
        >
          {({ data: { data, paging }, setObservedNode }) => {
            return (
              <>
                {data.length ? (
                  data.map((comment, i) => {
                    if (!comment) return null;

                    if (blacklistedUsers[comment.user.id])
                      delete stateRef.current.registeredIds[comment.id];
                    else stateRef.current.registeredIds[comment.id] = i;

                    return (
                      <div
                        key={comment.id}
                        ref={
                          i === data.length - 1
                            ? node => node && setObservedNode(node, true)
                            : null
                        }
                      >
                        <PostWidget
                          showThread={!!comment.threads.length}
                          docType="comment"
                          post={comment}
                          handleAction={_handleAction}
                          caption={getThreadOwners(comment)}
                          isRO={isRO}
                          secondaryAction={renderSecAction(comment.id)}
                          searchParams={searchParams}
                          withDialog={false}
                        />
                        {comment.threads.length
                          ? comment.threads?.map((_c, i) => {
                              const limit = Number(maxThread) || 100;
                              const params = `ro=${rootUid}&maxThread=${
                                stateRef.current.maxThread
                                  ? limit - stateRef.current.maxThread
                                  : limit - 1
                              }&withThread=true`;

                              if (blacklistedUsers[_c.user.id])
                                delete stateRef.current.registeredIds[_c.id];
                              else stateRef.current.registeredIds[_c.id] = i;

                              return _c ? (
                                <PostWidget
                                  key={_c.id}
                                  showThread={i !== comment.threads.length - 1}
                                  searchParams={params}
                                  post={_c}
                                  docType="comment"
                                  handleAction={_handleAction}
                                  caption={getThreadOwners(_c)}
                                  isRO={isRO}
                                  sx={{
                                    pt: 0
                                  }}
                                  secondaryAction={renderSecAction(_c.id)}
                                  withDialog={false}
                                />
                              ) : null;
                            })
                          : null}
                        {stateRef.current.pending[comment.id] ? (
                          <Loading />
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <EmptyData
                    sx={{
                      flex: 1
                    }}
                    label="Looks like there are no comments yet. Be the first to soshare!"
                  />
                )}
              </>
            );
          }}
        </InfiniteScroll>
      ) : null}
    </>
  );
};

Comments.propTypes = {};

export default Comments;
