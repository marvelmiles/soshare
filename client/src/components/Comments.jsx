import React, { useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import PostWidget from "./PostWidget";
import InfiniteScroll from "./InfiniteScroll";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import { removeFirstItemFromArray } from "utils";
import InputBox from "./InputBox";
import { Link } from "react-router-dom";
import { checkVisibility } from "utils/validators";
import EmptyData from "components/EmptyData";
import Loading from "components/Loading";
import { StyledLink } from "components/styled";
import { filterDocsByUserSet } from "utils";

// decided to use index-based rendering
// scability and real-time updates
// runs splicing since array is mutable from infinite scroll :)

const Comments = ({
  documentId,
  limit,
  handleAction,
  defaultShowEnd = true,
  docType,
  isRO,
  maxSizeElement,
  maxSize,
  rootUid = "",
  maxThread = 3,
  searchParams = `ro=${rootUid}&maxThread=${maxThread || ""}&withThread=true`,
  scrollNodeRef = null
}) => {
  const currentUser = useSelector(state => state.user.currentUser);
  const {
    socket,
    context: { blacklistedUsers, composeDoc },
    setContext
  } = useContext();
  const stateRef = useRef({
    url: `/comments/feed/${documentId}`,
    registeredIds: {},
    pending: {},
    notiferDelay: -1,
    searchParams
  });
  const infiniteScrollRef = useRef();
  const appendComment = useCallback(
    (comment, shallowAppend) => {
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
      stateCtx.registeredIds[comment.id] = -1;

      stateRef.current.notifierDelay =
        comment.user.id === currentUser.id ? -1 : undefined;
      const shallowProp = shallowAppend
        ? {
            preventFetch: false
          }
        : undefined;
      if (docId === documentId) {
        stateCtx.registeredIds[comment.id] = data.data.length;
        infiniteScrollRef.current.setData(
          {
            ...data,
            data: [comment, ...data.data]
          },
          shallowProp
        );
        handleAction &&
          handleAction("update", {
            document: comment.document
          });
      } else {
        const rIndex = stateCtx.registeredIds[comment.rootThread];
        let rootComment = data.data[rIndex];
        if (rootComment) {
          if (docId === rootComment.id) {
            delete stateCtx.registeredIds[(rootComment.threads[0]?.id)];
            rootComment = comment.document;
            stateCtx.registeredIds[comment.id] = 0;
            rootComment.threads[0] = comment;
          } else {
            const dIndex = stateCtx.registeredIds[docId];
            const endIndex = dIndex + 1;
            for (let i = endIndex; i < rootComment.threads.length; i++) {
              delete stateCtx.registeredIds[rootComment.threads[i].id];
            }
            rootComment.threads[dIndex] = comment.document;
            rootComment.threads = rootComment.threads.slice(0, endIndex);
            stateCtx.registeredIds[comment.id] = rootComment.threads.length;

            if (dIndex + 1 !== maxThread)
              rootComment.threads[endIndex] = comment;
          }
          data.data[rIndex] = rootComment;
          infiniteScrollRef.current.setData(
            {
              ...data
            },
            shallowProp
          );
        }
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
      if (!(index > -1)) return;

      cacheData &&
        document.comments &&
        (document.comments = removeFirstItemFromArray(uid, document.comments));

      const deleteFromReg = ({ id }) => delete stateCtx.registeredIds[id];
      let filterConfig;
      if (docId === documentId) {
        data.data.splice(index, 1).forEach(deleteFromReg);
        handleAction && handleAction("update", { document });
      } else {
        const rIndex = stateCtx.registeredIds[rootThread];
        let rootComment = data.data[rIndex],
          dIndex;
        const handleAnomaly = () => {
          // invoke just incase of multiple traffic collision maybe :(
          // based on dev and test it doesn't happen
        };
        if (rootComment) {
          if (docId === rootThread) {
            rootComment.threads.forEach(deleteFromReg);
            rootComment.threads = [];
          } else {
            dIndex = stateCtx.registeredIds[docId];
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
            } else handleAnomaly();
          }
        } else handleAnomaly();
        if (
          rootComment.threads[dIndex] &&
          rootComment.threads[dIndex].comments.length
        )
          filterConfig = {
            preventFetch: true
          };
        data.data[rIndex] = rootComment;
      }

      infiniteScrollRef.current.setData(
        {
          ...data
        },
        filterConfig
      );
    },
    [documentId, handleAction]
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
    const handleFilter = comment => removeComment(comment, false);

    const handleUpdate = comment => {
      _handleAction("update", {
        document: comment
      });
    };

    const handleAppend = (comment, shallowAppend) => {
      if (Array.isArray(comment)) {
        for (const _comment of comment) {
          appendComment(_comment, shallowAppend);
        }
      } else appendComment(comment, shallowAppend);
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
    if (composeDoc && composeDoc.docType === "comment") {
      switch (composeDoc.reason) {
        case "request":
          _handleAction("update", composeDoc.document);
          break;
        default:
          break;
      }
    }
  }, [composeDoc, _handleAction, setContext]);

  useEffect(() => {
    filterDocsByUserSet(
      infiniteScrollRef.current,
      blacklistedUsers,
      "threads",
      stateRef.current
    );
  }, [blacklistedUsers]);

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
            success: `Your comment has been soshared!`
          }}
          key={documentId + "-comment-input-box"}
        />
      ) : null}

      <InfiniteScroll
        key={documentId + "comments"}
        className="comments"
        ref={infiniteScrollRef}
        searchParams={stateRef.current.searchParams}
        limit={limit}
        url={stateRef.current.url}
        defaultShowEnd={defaultShowEnd}
        maxSizeElement={maxSizeElement}
        maxSize={maxSize}
        scrollNodeRef={scrollNodeRef}
        notifierDelay={stateRef.current.notifierDelay}
        notifierProps={{
          position: "fixed"
        }}
        withCredentials={isRO}
      >
        {({ data: { data } }) => {
          const getThreadOwners = (comment, i) => {
            const maxReplyTo = 3; // zero based index = 4
            const hasIndex = i < maxReplyTo;
            const reminder = i < maxReplyTo ? 0 : i - maxReplyTo;

            return (
              <span>
                Replying to
                {(() =>
                  [comment]
                    .concat(comment.threads.slice(0, hasIndex ? i : maxReplyTo))
                    .map(({ user: { username, id } }, i) => (
                      <span key={i}>
                        {" "}
                        <StyledLink to={`/u/${id}`}>
                          @{username}
                        </StyledLink>{" "}
                      </span>
                    )))()}
                {reminder > 0 ? (
                  <span>
                    and{" "}
                    {reminder > 1 ? (
                      `${reminder} others.`
                    ) : (
                      <StyledLink
                        to={`/u/${comment.threads[maxReplyTo].user.id}`}
                      >
                        @{comment.threads[maxReplyTo].user.username}
                      </StyledLink>
                    )}
                  </span>
                ) : null}
              </span>
            );
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
              {data.length ? (
                data.map((comment, i) => {
                  if (!comment) return null;

                  if (blacklistedUsers[comment.user.id])
                    delete stateRef.current.registeredIds[comment.id];
                  else stateRef.current.registeredIds[comment.id] = i;

                  return (
                    <div key={comment.id}>
                      <PostWidget
                        showThread={!!comment.threads.length}
                        docType="comment"
                        post={comment}
                        handleAction={_handleAction}
                        isRO={isRO}
                        secondaryAction={
                          comment.comments.length
                            ? renderSecAction(comment.id)
                            : undefined
                        }
                        searchParams={searchParams}
                        withDialog={false}
                      />
                      {comment.threads.length
                        ? comment.threads?.map((_c, i) => {
                            if (blacklistedUsers[_c.user.id])
                              delete stateRef.current.registeredIds[_c.id];
                            else stateRef.current.registeredIds[_c.id] = i;

                            return _c ? (
                              <PostWidget
                                key={_c.id}
                                showThread={i !== comment.threads.length - 1}
                                searchParams={searchParams}
                                post={_c}
                                docType="comment"
                                handleAction={_handleAction}
                                caption={getThreadOwners(comment, i)}
                                isRO={isRO}
                                sx={{
                                  pt: 0
                                }}
                                secondaryAction={
                                  _c.comments.length
                                    ? renderSecAction(_c.id)
                                    : undefined
                                }
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
    </>
  );
};

Comments.propTypes = {};

export default Comments;
