import React, { useState, useEffect, useCallback, useRef } from "react";
import PostWidget from "components/PostWidget";
import { useParams, useSearchParams } from "react-router-dom";
import http from "api/http";
import { useContext } from "context/store";
import Comments from "components/Comments";
import InputBox from "components/InputBox";
import MainView from "views/MainView";
import { removeFirstItemFromArray } from "utils";
import Loading from "components/Loading";
import EmptyData from "components/EmptyData";
import { StyledLink } from "components/styled";
import { useSelector } from "react-redux";
import Redirect from "components/Redirect";

const Post = () => {
  const cid = useSelector(state => state.user.currentUser?.id);
  const [post, setPost] = useState();
  const [redirect, setRedirect] = useState(false);
  let { kind = "", id = "" } = useParams();
  kind = kind.toLowerCase();
  const {
    socket,
    context: { blacklistedPosts, blacklistedUsers },
    setContext,
    setSnackBar
  } = useContext();
  const [searchParams] = useSearchParams();

  const isEditMode = (searchParams.get("edit") || "").toLowerCase() === "true";
  const docType = {
    posts: "post",
    comments: "comment"
  }[kind];

  const fetchDocument = useCallback(async () => {
    try {
      setPost(undefined);
      const post = await http.get(`/${kind}/${id}`, {
        withCredentials: !!cid
      });
      setPost(post);
    } catch (message) {
      message = message.message || message;
      if (message === `owner blacklisted`)
        stateRef.current.info = "blacklisted";
      else if (message === "404") stateRef.current.info = "404";
      else setSnackBar(message);
      setPost(null);
    }
  }, [cid, setSnackBar, kind, id]);
  const stateRef = useRef({});

  const _handleAction = useCallback(
    (reason, options = {}) => {
      const { document, value, uid } = options;
      switch (reason) {
        case "filter":
          setContext(context => {
            context.blacklistedPosts[post.id] = "404";
            return { ...context };
          });
          setRedirect(true);
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
        case "clear-cache":
          setContext(context => {
            delete context.blacklistedPosts[post.id];
            return { ...context };
          });
          break;
        case "blacklisted":
          uid && setRedirect(true);
          break;
        default:
          break;
      }
    },
    [setContext, post?.id]
  );

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  useEffect(() => {
    const handleFilter = document => {
      if (post?.id === document.id && document.user.id !== cid)
        _handleAction("filter", { document });
    };

    const handleUpdate = document => {
      post?.id === document.id && _handleAction("update", { document });
    };
    socket.on(`update-${docType}`, handleUpdate);
    socket.on(`filter-${docType}`, handleFilter);

    return () => {
      socket.removeEventListener(`filter-${docType}`, handleFilter);
      socket.removeEventListener(`update-${docType}`, handleUpdate);
    };
  }, [socket, docType, _handleAction, post?.id, cid]);

  useEffect(() => {
    if (blacklistedUsers[(post?.user.id)]) _handleAction("filter");
  }, [blacklistedUsers, post?.user.id, _handleAction]);

  if (!docType) stateRef.current.info = "500";

  const statusText = stateRef.current.info || blacklistedPosts[(post?.id)];

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
      {redirect || (isEditMode && post && post.user.id !== cid) ? (
        <Redirect />
      ) : (
        <>
          {post === undefined ? (
            <Loading />
          ) : !statusText && post?.id ? (
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
              ) : null}
              {isEditMode ? null : (
                <PostWidget
                  docType={docType}
                  handleAction={_handleAction}
                  post={post}
                  plainWidget
                  sx={{
                    borderBottom: "1px solid #fff",
                    borderBottomColor: "divider",
                    borderTop: "none"
                  }}
                  disableNavigation
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
                isRO={
                  post.user?.id === cid || post.rootThread?.user?.id === cid
                }
                rootUid={post.user.id}
                key={post.id}
                sx={{ minHeight: 0, height: "auto" }}
              />
            </>
          ) : (
            {
              blacklisted: (
                <EmptyData
                  label={
                    <span>
                      We're sorry, you cannot view this {docType} as the user
                      who owns it has been{" "}
                      {cid ? (
                        <StyledLink to={`/u/${cid}?view=blacklist`}>
                          blacklisted
                        </StyledLink>
                      ) : (
                        "blacklisted"
                      )}
                      . We strive to provide a safe and positive community
                      experience for all our users, and as such, we do not
                      permit access to content owned by blacklisted users
                    </span>
                  }
                  maxWidth="500px"
                />
              ),
              "404": (
                <EmptyData
                  maxWidth="300px"
                  label={
                    <>
                      {{ post: "Post", comment: "Comment" }[docType]} not found
                      or {docType} visibility has been restricted by the
                      curator.{" "}
                      <StyledLink to="/search?q=all&tab=posts">
                        Find a post here!
                      </StyledLink>
                    </>
                  }
                />
              ),
              500: <EmptyData maxWidth="300px" label={<>Page not found</>} />
            }[statusText] || <EmptyData onClick={fetchDocument} />
          )}
        </>
      )}
    </MainView>
  );
};

export default Post;
