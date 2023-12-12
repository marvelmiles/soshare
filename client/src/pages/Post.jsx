import React, { useState, useEffect, useCallback, useRef } from "react";
import PostWidget from "components/PostWidget";
import { useParams, useSearchParams } from "react-router-dom";
import http from "api/http";
import { useContext } from "context/store";
import Comments from "components/Comments";
import InputBox from "components/SosharePen";
import MainView from "views/MainView";
import { removeFirstItemFromArray } from "utils";
import Loading from "components/Loading";
import EmptyData from "components/EmptyData";
import { StyledLink } from "components/styled";
import { useSelector } from "react-redux";
import Redirect from "components/Redirect";
import {
  HTTP_CODE_DOCUMENT_NOT_FOUND,
  HTTP_CODE_USER_BLACKLISTED
} from "context/constants";
import { isDocVisibleToUser } from "utils/validators";

const Post = () => {
  const currentUser = useSelector(state => state.user.currentUser);

  const [post, setPost] = useState({
    user: {}
  });
  const [loading, setLoading] = useState(true);

  let { kind = "", id = "" } = useParams();
  kind = kind.toLowerCase();

  const {
    socket,
    context: { _blacklistedPosts },
    setContext,
    setSnackBar
  } = useContext();

  const [searchParams] = useSearchParams();

  const isEditMode = (searchParams.get("edit") || "").toLowerCase() === "true";

  const docType = {
    posts: "post",
    comments: "comment"
  }[kind];

  const fetchDocument = useCallback(
    async id => {
      try {
        stateRef.current.withStatus = false;

        setLoading(true);

        const post = await http.get(
          `/${kind}/${id}?withVisibilityQuery=false`,
          {
            withCredentials: !!currentUser.id
          }
        );

        const isRO = currentUser.id
          ? post.user?.id === currentUser.id ||
            (post.rootThread
              ? post.rootThread.user?.id === currentUser.id
              : post.document?.user?.id === currentUser.id)
          : undefined;

        if (!(isRO || isDocVisibleToUser(post, currentUser)))
          throw {
            code: HTTP_CODE_DOCUMENT_NOT_FOUND
          };

        post._isRO = isRO;

        setPost(post);
      } catch ({ code, message, isCancelled }) {
        stateRef.current.withStatus = true;

        if (code === HTTP_CODE_USER_BLACKLISTED)
          stateRef.current.info = "blacklisted";
        else if (code === HTTP_CODE_DOCUMENT_NOT_FOUND)
          stateRef.current.info = "404";
        else if (!isCancelled) setSnackBar(message);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, setSnackBar, kind]
  );

  const stateRef = useRef({});

  const _handleAction = useCallback(
    (reason, options = {}) => {
      const { document, value } = options;
      switch (reason) {
        case "filter":
          setContext(context => {
            context._blacklistedPosts[post.id] = "404";
            return { ...context };
          });
          break;
        case "filter-comment":
          setPost(post => {
            if (post.comments.length <= post.comments.length - 1) return;
            return {
              ...post,
              comments: removeFirstItemFromArray(value, post.comments)
            };
          });
          break;
        case "update":
          setPost(post => ({
            ...post,
            ...document
          }));
          break;
        default:
          break;
      }
    },
    [setContext, post.id]
  );

  useEffect(() => {
    fetchDocument(id);
  }, [fetchDocument, id, isEditMode]);

  useEffect(() => {
    const handleFilter = document => {
      if (post.id === document.id && document.user.id !== currentUser.id)
        _handleAction("filter", { document });
    };

    const handleUpdate = document => {
      post.id === document.id && _handleAction("update", { document });
    };
    socket.on(`update-${docType}`, handleUpdate);
    socket.on(`filter-${docType}`, handleFilter);

    return () => {
      socket.removeEventListener(`filter-${docType}`, handleFilter);
      socket.removeEventListener(`update-${docType}`, handleUpdate);
    };
  }, [socket, docType, _handleAction, post.id, currentUser.id]);

  if (!docType) stateRef.current.info = "500";

  if (
    post.user &&
    (currentUser._blockedUsers[post.user.id] ||
      currentUser._disapprovedUsers[post.user.id])
  )
    stateRef.current.info = "blacklisted";

  const statusText =
    stateRef.current.withStatus &&
    (stateRef.current.info || _blacklistedPosts[post.id]);

  return (
    <MainView
      borderline
      sx={{
        ".main-content-container": {
          display: "flex",
          flexDirection: "column",
          ".data-scrollable.comments": {
            flex: 1,
            minHeight: 0
          }
        }
      }}
      key={`post-main-view-${isEditMode}`}
    >
      {loading ? (
        <Loading />
      ) : statusText ? (
        {
          blacklisted: (
            <EmptyData
              label={
                <span>
                  We're sorry, you are not allowed to view this{" "}
                  {docType || "page"}. We strive to provide a safe and positive
                  community experience for all our users, and as such, we do not
                  permit access to content owned by blacklisted curators.
                </span>
              }
              maxWidth="500px"
            />
          ),
          "404": (
            <EmptyData
              label={
                <>
                  {{ post: "Post", comment: "Comment" }[docType]} not found or{" "}
                  {docType} visibility has been restricted.{" "}
                  <StyledLink to="/search?q=&tab=posts">
                    Find a post here!
                  </StyledLink>
                </>
              }
            />
          ),
          500: <EmptyData label={<>Page not found</>} />
        }[statusText]
      ) : isEditMode && post.user.id !== currentUser.id ? (
        <Redirect />
      ) : (
        <>
          {isEditMode ? (
            <InputBox
              resetData={false}
              showDeleteBtn
              handleAction={_handleAction}
              placeholders={{
                text: post.text,
                visibility: post.visibility,
                medias: post.medias,
                id: post.id
              }}
              url={`/${kind}/${post.id}`}
              dialogTitle={docType}
              urls={{
                delPath: `/${kind}`
              }}
            />
          ) : (
            <PostWidget
              plainWidget
              disableNavigation
              docType={docType}
              handleAction={_handleAction}
              post={post}
            />
          )}

          <Comments
            context={{
              commentSize: post.comments.length
            }}
            documentId={id}
            docType={docType}
            user={post.user}
            handleAction={_handleAction}
            isRO={post._isRO}
            rootUid={post.user?.id}
            key={post.id}
            sx={{ minHeight: 0, height: "auto" }}
          />
        </>
      )}
    </MainView>
  );
};

export default Post;
