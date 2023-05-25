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
  stateRef,
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
  const _stateRef = useRef({
    cachedComments: {},
    url: `/comments/feed/${documentId}`,
    registeredIds: {},
    threads: {}
  });
  const infiniteScrollRef = useRef();
  const appendComment = useCallback(
    (commentOrIndex, replace) => {
      const data = infiniteScrollRef.current?.data;
      const _stateRef = _stateRef.current;
      if (
        (data &&
          !(
            commentOrIndex.id ||
            (commentOrIndex = _stateRef.cachedComments[commentOrIndex])
          )) ||
        _stateRef.lastId === commentOrIndex.id
      )
        return;
      _stateRef.lastId = commentOrIndex.id;
      console.log(" append comment ");
      if (_stateRef.registeredIds[commentOrIndex.id]) return;
      _stateRef.registeredIds[commentOrIndex.id] = commentOrIndex.id;
      if (!checkVisibility(commentOrIndex, currentUser)) return;
      const isDoc = documentId === commentOrIndex.document.id;
      if (isDoc) {
        infiniteScrollRef.current.setData({
          ...data,
          data: [commentOrIndex, ...data.data]
        });
        handleAction && handleAction("update", commentOrIndex.document);
      } else if (infiniteScrollRef.current) {
        for (let key in _stateRef.threads) {
          const index = _stateRef.threads[key];
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
      const _stateRef = _stateRef.current;
      infiniteScrollRef.current.setData({
        ...infiniteScrollRef.current.data,
        data: infiniteScrollRef.current.data.data.filter((comment, _index) => {
          if (id === comment.id) {
            delete _stateRef.registeredIds[id];
            cacheData && (_stateRef.cachedComments[id] = comment);
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
                cacheData && (_stateRef.cachedComments[c.thread.id] = c.thread);
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
      const _stateRef = _stateRef.current;

      switch (reason) {
        case "filter":
          removeComment(res, cacheData);
          break;
        case "clear-cache":
          delete _stateRef.cachedComments[res];
          delete _stateRef.registeredIds[res];
          break;
        case "update":
          infiniteScrollRef.current.setData({
            ...infiniteScrollRef.current.data,
            data: infiniteScrollRef.current.data.data.map(comment =>
              comment.id === res.id ? { ...comment, ...res } : comment
            )
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
      _handleAction("update", comment);
    });
    socket.on("filter-comment", comment => {
      if (comment.user.id !== currentUser.id) removeComment(comment, false);
    });
  }, [appendComment, socket, removeComment, currentUser.id, _handleAction]);

  // if (infiniteScrollRef.current?.data.data.length && stateRef) {
  //   if (!stateRef[documentId]) stateRef[documentId] = {};
  //   stateRef[documentId].childData = infiniteScrollRef.current.data;
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
    const _stateRef = _stateRef.current;
    const stack = [],
      depth = maxThread;

    delete _stateRef.registeredIds[comment.id];
    if (depth) {
      _stateRef.threads[comment.id] = index;
      let c = comment;
      for (let i = 0; i < depth && c.thread; i++) {
        stack.push(c.thread);
        c = c.thread;
        delete _stateRef.registeredIds[c.id];
      }
    }
    return stack;
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
    <Box>
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
      {autoFetchReplies === true ? (
        <InfiniteScroll
          ref={infiniteScrollRef}
          searchParams={searchParams}
          limit={limit}
          url={_stateRef.url}
          onData={_handleAction}
          // defaultData={stateRef?.[documentId]?.childData || defaultData}
          defaultShowEnd={defaultShowEnd}
          httpConfig={
            isRO && {
              withCredentials: true
            }
          }
          sx={{
            minHeight: "100px",
            ...sx
          }}
          maxSizeElement={maxSizeElement}
          maxSize={maxSize}
          scrollNodeRef={scrollNodeRef}
        >
          {({ data: { data, paging }, setObservedNode }) => {
            return (
              <>
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
                  <EmptyData label="Looks like there are no comments yet. Be the first to share your thoughts!" />
                )}
              </>
            );
          }}
        </InfiniteScroll>
      ) : null}
    </Box>
  );
};

Comments.propTypes = {};

export default Comments;
