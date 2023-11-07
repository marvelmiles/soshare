import React, { useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import PostWidget from "./PostWidget";
import InfiniteScroll from "./InfiniteScroll";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import { removeFirstItemFromArray } from "utils";
import SosharePen from "./SosharePen";
import { Link } from "react-router-dom";
import { isDocVisibleToUser } from "utils/validators";
import EmptyData from "components/EmptyData";
import Loading from "components/Loading";
import { StyledLink } from "components/styled";
import { filterDocsByUserSet } from "utils";

// NOTE

// decided to use index-based rendering
// scability and real-time updates
// runs splicing since array is mutable from infinite scroll :)

// future changes

// comment.threads should be a client prop not server

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
    context: { composeDoc },
    setContext
  } = useContext();

  const stateRef = useRef({
    url: `/comments/feed/${documentId}`,
    pending: {},
    notiferDelay: -1,
    searchParams,
    registeredIds: {},
    rootIds: {}
  });
  const infiniteScrollRef = useRef();

  const appendComment = useCallback(
    (comment, shallowAppend) => {
      const data = infiniteScrollRef.current?.data;
      const stateCtx = stateRef.current;

      const docId = comment.document.id;
      const isDocRoot = docId === documentId;

      const rIndex = stateCtx.rootIds[docId];
      const isRoot = stateCtx.registeredIds[docId] === undefined;

      const idsRecord = stateCtx[isRoot ? "rootIds" : "registeredIds"];

      let rootComment = data.data[rIndex] || {
        threads: []
      };

      if (isDocRoot ? false : !rootComment.id) return;

      const dIndex = stateCtx.registeredIds[docId];
      const doc = rootComment.threads[dIndex] || data.data[dIndex];

      if (
        stateCtx.registeredIds[comment.id] >= -1 ||
        !(
          isDocVisibleToUser(comment, currentUser) &&
          (isDocRoot || isRoot || doc)
        )
      )
        return;

      idsRecord[comment.id] = -1;

      stateRef.current.notifierDelay =
        comment.user.id === currentUser.id ? -1 : undefined;

      const shallowProp = shallowAppend
        ? {
            preventFetch: false
          }
        : undefined;

      if (isDocRoot) {
        idsRecord[comment.id] = data.data.length;

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
        stateCtx.rootIds[comment.id] = rIndex;

        if (isRoot) {
          delete idsRecord[(rootComment.threads[0]?.id)];

          rootComment = comment.document;
          idsRecord[comment.id] = 0;

          rootComment.threads[0] = comment;

          data.data[rIndex] = rootComment;
        } else {
          const endIndex = dIndex + 1;

          for (let i = endIndex; i < rootComment.threads.length; i++) {
            delete idsRecord[rootComment.threads[i].id];
          }

          rootComment.threads[dIndex] = comment.document;
          rootComment.threads = rootComment.threads.slice(0, endIndex);
          idsRecord[comment.id] = rootComment.threads.length;

          if (dIndex + 1 !== maxThread) {
            comment._rootId = doc._rootId;
            rootComment.threads[endIndex] = comment;
          }
        }

        infiniteScrollRef.current.setData(
          {
            ...data
          },
          shallowProp
        );
      }
    },
    [currentUser, documentId, handleAction, maxThread]
  );

  const removeComment = useCallback(
    ({ id, document, user: { id: uid } }, cacheData = true) => {
      const stateCtx = stateRef.current;

      const docId = document.id;

      const isDocRoot = docId === documentId;

      const data = infiniteScrollRef.current.data;

      const idsRecord = stateCtx[isDocRoot ? "rootIds" : "registeredIds"];

      const index = idsRecord[id];

      if (!(index > -1)) return;

      cacheData &&
        document.comments &&
        (document.comments = removeFirstItemFromArray(uid, document.comments));

      const deleteFromReg = ({ id }) => delete idsRecord[id];

      let filterConfig;

      if (isDocRoot) {
        data.data.splice(index, 1).forEach(deleteFromReg);
        handleAction && handleAction("update", { document });
      } else {
        const rIndex = stateCtx.rootIds[id];

        let rootComment = data.data[rIndex],
          dIndex;

        const handleAnomaly = () => {
          // invoke just incase of multiple traffic collision maybe :(
          // based on dev and test it doesn't happen
          // aim is to find comment by loop (top-down). since it id or
          // rootComment doesn't exist in record.
        };

        if (rootComment) {
          if (docId === rootComment.id) {
            rootComment.threads.forEach(deleteFromReg);
            rootComment.threads = [];
          } else {
            dIndex = idsRecord[docId];

            if (dIndex > -1 && rootComment.threads[dIndex].id === docId) {
              // server populate error handling
              if (typeof document.document === "string") {
                const _dIndex = idsRecord[document.document];

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
            if (rootComment) {
              const comment = rootComment.threads[index];
              if (comment)
                rootComment.threads[index] = {
                  ...comment,
                  ...document,
                  threads: [...comment.threads, ...document.threads]
                };
              data.data[rIndex] = rootComment;
            }
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
      { ...currentUser._blockedUsers, ...currentUser._disapprovedUsers },
      "threads",
      stateRef.current
    );
  }, [currentUser._blockedUsers, currentUser._disapprovedUsers]);

  return (
    <>
      {docType ? (
        <SosharePen
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
        verify="zx"
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
                replace
                onClick={e => {
                  e.stopPropagation();
                }}
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

                  if (
                    currentUser._blockedUsers[comment.user.id] ||
                    currentUser._disapprovedUsers[comment.user.id]
                  )
                    delete stateRef.current.rootIds[comment.id];
                  else stateRef.current.rootIds[comment.id] = i;

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
                        ? comment.threads?.map((_c, _i) => {
                            if (
                              currentUser._blockedUsers[comment.user.id] ||
                              currentUser._disapprovedUsers[comment.user.id]
                            ) {
                              delete stateRef.current.registeredIds[_c.id];
                              delete stateRef.current.rootIds[_c.id];
                            } else {
                              stateRef.current.registeredIds[_c.id] = _i;
                              stateRef.current.rootIds[_c.id] = i;
                            }

                            return _c ? (
                              <PostWidget
                                key={_c.id}
                                showThread={_i !== comment.threads.length - 1}
                                searchParams={searchParams}
                                post={_c}
                                docType="comment"
                                handleAction={_handleAction}
                                caption={getThreadOwners(comment, _i)}
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
