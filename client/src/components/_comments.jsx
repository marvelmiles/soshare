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
  rootUid,
  maxThread = 100,
  searchParams = rootUid
    ? `ro=${rootUid}&maxThread=${maxThread || ""}&withThread=true`
    : "",
  scrollNodeRef = null,
  infiniteProps
}) => {
  const currentUser = useSelector(state => state.user.currentUser || {});
  const { composeDoc, socket } = useContext();
  const [withShowRetry, setWithShowRetry] = useState(true);
  const stateRef = useRef({
    cachedComments: {},
    url: `/comments/feed/${documentId}`,
    registeredIds: {},
    pending: {}
  });
  const infiniteScrollRef = useRef();
  const appendComment = useCallback(
    (commentOrIndex, replace) => {
      const data = infiniteScrollRef.current?.data;
      const stateCtx = stateRef.current;
      delete stateCtx.pending[commentOrIndex.rootThread];

      if (
        (data &&
          !(
            commentOrIndex.id ||
            (commentOrIndex = stateCtx.cachedComments[commentOrIndex])
          )) ||
        !commentOrIndex.document?.id ||
        stateCtx.registeredIds[commentOrIndex.id] !== undefined ||
        !checkVisibility(commentOrIndex, currentUser)
      )
        return;

      console.log("appending commenf");
      if (commentOrIndex.rootThread) {
        // dummy assignment only helps to prevent duplicate
        stateCtx.registeredIds[commentOrIndex.id] = -1;

        const rIndex = stateCtx.registeredIds[commentOrIndex.rootThread];
        let rootComment = data.data[rIndex];
        console.log(commentOrIndex, rootComment);
        if (commentOrIndex.document.id === rootComment.id) {
          if (rootComment.threads.length)
            delete stateCtx.registeredIds[rootComment.threads[0].id];
          rootComment = commentOrIndex.document;
          stateCtx.registeredIds[commentOrIndex.id] = 0;
          rootComment.threads[0] = commentOrIndex;
        } else {
          const dIndex = stateCtx.registeredIds[commentOrIndex.document.id];
          if (rootComment.threads[dIndex]) {
            rootComment.threads[dIndex] = commentOrIndex.document;
              if (rootComment.threads.length < maxThread) {
              rootComment.threads
                .slice(dIndex + 1)
                .forEach(({ id }) => delete stateCtx.registeredIds[id]);

              rootComment.threads = rootComment.threads.slice(0, dIndex + 1);
              stateCtx.registeredIds[commentOrIndex.id] =
                rootComment.threads.length;
              rootComment.threads.push(commentOrIndex);
              stateRef.current.maxThread = dIndex + 1;
            }
          } else console.log(" max reached,,,");
        }
        data.data[rIndex] = rootComment;
        infiniteScrollRef.current.setData({
          ...data
        });
      } else {
        stateCtx.registeredIds[commentOrIndex.id] = data.data.length;
        infiniteScrollRef.current.setData({
          ...data,
          data: [commentOrIndex, ...data.data]
        });
        handleAction && handleAction("update", commentOrIndex.document);
      }
    },
    [handleAction, currentUser, maxThread]
  );

  const removeComment = useCallback(
    (
      { id, rootThread, document, user: { id: uid } },
      clearHandled,
      cacheData = true
    ) => {
      // using filter hoc just has a fallback in weird cases.
      //  splice index works
      const stateCtx = stateRef.current;
      const handledKey = id + "comments";
      if (stateCtx.registeredIds[handledKey]) {
        if (clearHandled) delete stateCtx.registeredIds[handledKey];
        return;
      } else {
        stateCtx.registeredIds[handledKey] = true;
      }
      console.log("removing once...", id);
      const data = infiniteScrollRef.current.data;
      const index = stateCtx.registeredIds[id];
      let rootComment;
      if (document.id) {
        if (document.id === documentId) {
          if (index > -1) data.data.splice(index, 1);
          else {
            data.data = data.data.filter(comment => {
              if (comment.id === id) {
                return false;
              }
              return true;
            });
          }
          handleAction("filter-comment", uid);
        } else {
          let dIndex = stateCtx.registeredIds[document.id];
          let rIndex = stateCtx.registeredIds[rootThread];
          rIndex =
            rIndex > -1
              ? rIndex
              : data.data.findIndex(comment => comment.id === rootThread);
          rootComment = data.data[rIndex];
          if (index >= -1) {
            if (index === -1) {
              rootComment.threads = rootComment.threads.filter(
                ({ id: _id }, i) => {
                  if (_id === id) {
                    if (i) dIndex = i - 1;
                    return false;
                  }
                  return true;
                }
              );
            } else rootComment.threads.splice(index, 1);
            dIndex =
              dIndex > -1
                ? dIndex
                : rootComment.threads.findIndex(
                    comment => comment.id === document.id
                  );
            document.comments = removeFirstItemFromArray(
              uid,
              document.comments
            )
            document.id === rootThread
              ? (data.data[dIndex] = document)
              : (rootComment.threads[dIndex] = document);
          }
        }
      } else {
        const rIndex = stateCtx.registeredIds[rootThread];
        const filterComment = ({ id: _id }) => {
          if (id === _id) {
            delete stateCtx.registeredIds[id];
            return false;
          }
          return true;
        };
        if (rootThread && (rootComment = data.data[rIndex])) {
          rootComment.threads = rootComment.threads.filter(filterComment);
          data.data[rIndex] = rootComment;
        } else
          data.data = data.data.filter(filterComment).map(c => {
            if (c.id === id) c.threads = c.threads.filter(filterComment);
            return c;
          });
      }
      delete stateCtx.registeredIds[id];
      console.log(document?.id, " dio[ ");
      if (document.comments?.length) stateCtx.pending[rootThread] = true;
      infiniteScrollRef.current.setData({
        ...data
      });
    },
    [handleAction, documentId]
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
          return console.log("update...");
          const index = stateCtx.registeredIds[res.id];
          const data = infiniteScrollRef.current.data;
          if (res.rootThread) {
            const rIndex = stateCtx.registeredIds[res.rootThread];
            const rootComment = data.data[rIndex];
            rootComment.threads[index] = {
              ...rootComment.threads[index],
              ...res
            };
            data.data[rIndex] = rootComment;
          } else {
            if (index > -1) {
              data.data[index] = { ...data.data[index], ...res };
            } else {
              data.data = data.data.map(comment =>
                comment.id === res.id ? { ...comment, ...res } : comment
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
    socket.on("comment", (comment, replace) => {
      if (Array.isArray(comment)) {
        for (const _comment of comment) {
          appendComment(_comment, replace);
        }
      } else appendComment(comment, replace);
    });
    socket.on("update-comment", comment => {
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
          withPlaceholders
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
          handleAction={_handleAction}
          {...infiniteProps}
        />
      ) : null}
      {autoFetchReplies === true ? (
        <InfiniteScroll
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
          notifierDelay={
            composeDoc?.user?.id === currentUser.id ? -1 : undefined
          }
        >
          {({ data: { data, paging }, setObservedNode }) => {
            return (
              <>
                {data.length ? (
                  data.map((comment, i) => {
                    if (!comment) return null;
                    stateRef.current.registeredIds[comment.id] = i;
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
                          searchParams={searchParams}
                        />
                        {comment.threads?.map((_c, i) => {
                          const limit = Number(maxThread) || 100;
                          const params = `ro=${rootUid}&maxThread=${
                            stateRef.current.maxThread
                              ? limit - stateRef.current.maxThread
                              : limit - 1
                          }`;

                          stateRef.current.registeredIds[_c.id] = i;
                          return _c ? (
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
                          ) : null;
                        })}
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
