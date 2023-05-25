import React, { useRef, useEffect, useCallback } from "react";
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

const Comments = ({
  documentId,
  limit,
  autoFetchReplies = true,
  context,
  handleAction,
  defaultShowEnd = true,
  docType,
  user,
  defaultData,
  isRO,
  sx,
  maxSizeElement,
  maxSize,
  rootUid,
  maxThread = 2,
  searchParams = rootUid
    ? `ro=${rootUid}&maxThread=${maxThread || ""}&withThread=true`
    : "",
  scrollNodeRef = null,
  infiniteProps
}) => {
  const currentUser = useSelector(state => state.user.currentUser || {});
  const { composeDoc, socket } = useContext();
  const stateRef = useRef({
    cachedComments: {},
    url: `/comments/feed/${documentId}`,
    registeredIds: {},
    threads: {}
  });
  const infiniteScrollRef = useRef();
  const appendComment = useCallback(
    (commentOrIndex, replace) => {
      const data = infiniteScrollRef.current?.data;
      const stateCtx = stateRef.current;
      if (
        (data &&
          !(
            commentOrIndex.id ||
            (commentOrIndex = stateCtx.cachedComments[commentOrIndex])
          )) ||
        stateCtx.registeredIds[commentOrIndex.id] ||
        !checkVisibility(commentOrIndex, currentUser)
      )
        return;

      stateCtx.registeredIds[commentOrIndex.id] = commentOrIndex.id;

      const isDoc = documentId === commentOrIndex.document.id;
      if (isDoc) {
        infiniteScrollRef.current.setData({
          ...data,
          data: [commentOrIndex, ...data.data]
        });
        handleAction && handleAction("update", commentOrIndex.document);
      } else if (infiniteScrollRef.current) {
        for (let key in stateCtx.threads) {
          const index = stateCtx.threads[key];
          const d = data.data[index];
          if (key === commentOrIndex.document.id) {
            !replace && d.comments.push(commentOrIndex.user.id);
            if (commentOrIndex.user.id === rootUid) d.thread = commentOrIndex;
            data.data[index] = d;
            break;
          }
          let f = d;
          while (f.thread) {
            if (f.thread.id === commentOrIndex.document.id) {
              !replace && f.thread.comments.push(commentOrIndex.user.id);
              if (commentOrIndex.user.id === rootUid)
                f.thread.thread = commentOrIndex;
              break;
            }
            f = f.thread;
          }
          data.data[index] = d;
        }
        infiniteScrollRef.current.setData({
          ...data
        });
      }
    },
    [documentId, handleAction, currentUser, rootUid]
  );

  const removeComment = useCallback(
    (
      { id, threads, document: { id: did }, user: { id: uid } },
      cacheData = true
    ) => {
      const stateCtx = stateRef.current;
      infiniteScrollRef.current.setData({
        ...infiniteScrollRef.current.data,
        data: infiniteScrollRef.current.data.data.filter((comment, _index) => {
          if (id === comment.id) {
            delete stateCtx.registeredIds[id];
            cacheData && (stateCtx.cachedComments[id] = comment);
            handleAction("filter-comment", {
              uid: comment.user.id,
              docId: comment.document.id,
              cid: comment.id
            });
            return false;
          } else if (
            threads.length &&
            threads[threads.length - 1].id === comment.id
          ) {
            let c = comment;
            do {
              if (c.id === did) {
                cacheData && (stateCtx.cachedComments[c.thread.id] = c.thread);
                delete c.thread;
                c.comments = removeFirstItemFromArray(uid, c.comments);
                break;
              }
              c = c.thread;
            } while (c.thread);
          }
          return true;
        })
      });
    },
    [handleAction]
  );
  const _handleAction = useCallback(
    (reason, res, cacheData = true) => {
      const stateCtx = stateRef.current;

      switch (reason) {
        case "filter":
          removeComment(res, cacheData);
          break;
        case "clear-cache":
          delete stateCtx.cachedComments[res];
          delete stateCtx.registeredIds[res];
          break;
        case "update":
          infiniteScrollRef.current.setData({
            ...infiniteScrollRef.current.data,
            data: infiniteScrollRef.current.data.data.map(comment => {
              const stateCtx = stateRef.current;
              if (comment.id === res.id) return { ...comment, ...res };
              for (const key in stateCtx.threads) {
                const item = data.data[stateCtx.threads[key]];
              }
              return comment;
            })
          });
          break;
        default:
          break;
      }
    },
    [removeComment]
  );
  useEffect(() => {
    socket.on("comment", (comment, replace) => {
      appendComment(comment, replace);
    });
    socket.on("update-comment", comment => {
      console.clear();
      console.log(comment.id, comment.document.id || comment.document);
      _handleAction("update", comment);
    });
    socket.on("filter-comment", comment => {
      removeComment(comment, false);
    });
  }, [appendComment, socket, removeComment, currentUser.id, _handleAction]);

  // if (infiniteScrollRef.current?.data.data.length && stateCtx) {
  //   if (!stateCtx[documentId]) stateCtx[documentId] = {};
  //   stateCtx[documentId].childData = infiniteScrollRef.current.data;
  // }
  const getThreadOwners = c => {
    if (!c || c.user.id === currentUser.id) return;
    let str = c.threads.length
      ? "Replying to "
      : `Replying to ${user.username || c.document.user.username}`;
    let shown = 0;
    for (const thread of c.threads) {
      const {
        user: { username, id },
        document: {
          user: { username: run, id: rid }
        }
      } = thread;

      if (str.length > 140) {
        str += ` ${c.threads.length - shown} others.`;
        break;
      }
      shown++;
      str += ` ${username} and ${run}`;
    }
    return str;
  };
  const getThreads = (comment, index) => {
    const stateCtx = stateRef.current;
    const threads = [],
      depth = maxThread;

    delete stateCtx.registeredIds[comment.id];
    if (depth) {
      stateCtx.threads[comment.id] = index;
      let c = comment;
      for (let i = 0; i < depth && c.thread; i++) {
        threads.push(c.thread);
        c = c.thread;
        delete stateCtx.registeredIds[c.id];
      }
    }
    return threads;
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
      {autoFetchReplies === true ? (
        <InfiniteScroll
          className="comments"
          ref={infiniteScrollRef}
          searchParams={searchParams}
          limit={limit}
          url={stateRef.current.url}
          onData={_handleAction}
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
          notifierDelay={
            composeDoc?.user.id === currentUser.id ? -1 : undefined
          }
        >
          {({ data: { data, paging }, setObservedNode }) => {
            return (
              <>
                {docType ? (
                  <InputBox
                    withPlaceholders
                    autoFocus={false}
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
                    {...infiniteProps}
                  />
                ) : null}

                {data.length ? (
                  data.map((comment, i) => {
                    if (!comment) return null;
                    const params = `ro=${rootUid}&maxThread=${(Number(
                      maxThread
                    ) || 2) - 1}`;
                    return (
                      <div
                        key={comment.id}
                        ref={
                          i === data.length - (data.length > 4 ? 3 : 1)
                            ? node => node && setObservedNode(node)
                            : null
                        }
                      >
                        <PostWidget
                          showThread={!!comment.thread}
                          docType="comment"
                          post={
                            comment.id === composeDoc?.id &&
                            composeDoc?.createdAt
                              ? composeDoc
                              : comment
                          }
                          handleAction={_handleAction}
                          caption={getThreadOwners(comment)}
                          isRO={isRO}
                          secondaryAction={renderSecAction(comment.id)}
                        />
                        {getThreads(comment, i).map((_c, i) =>
                          _c ? (
                            <PostWidget
                              key={_c.id}
                              showThread={
                                maxThread - 1 > i &&
                                _c.comments.length &&
                                _c.thread
                              }
                              searchParams={`${params}&withThread=true`}
                              post={_c}
                              docType="comment"
                              handleAction={_handleAction}
                              caption={getThreadOwners(_c)}
                              isRO={isRO}
                              sx={{
                                pt: 0
                              }}
                              secondaryAction={renderSecAction(_c.id)}
                            />
                          ) : null
                        )}
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
