import React, { useState, useEffect, useCallback, useRef } from "react";
import PostWidget from "components/PostWidget";
import {
  useParams,
  useSearchParams,
  Navigate,
  useNavigate
} from "react-router-dom";
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

const Post = () => {
  const cid = useSelector(state => state.user.currentUser?.id);
  const [post, setPost] = useState();
  let { kind = "", id = "" } = useParams();
  kind = kind.toLowerCase();
  const navigate = useNavigate();
  const { setSnackBar, socket } = useContext();
  const [searchParams] = useSearchParams();
  const isEditMode = (searchParams.get("edit") || "").toLowerCase() === "true";
  const isShort = kind === "shorts";
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
    (reason, res) => {
      switch (reason) {
        case "filter":
          navigate(-1);
          break;
        case "filter-comment":
          setPost(post => {
            if (post.comments.length <= post.comments.length - 1) return;
            return {
              ...post,
              comments: removeFirstItemFromArray(res, post.comments)
            };
          });
          break;
        case "update":
          setPost(post => ({
            ...post,
            ...res
          }));
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  useEffect(() => {
    const handleFilter = document => {
      if (post?.id === document.id) _handleAction("filter", document);
    };

    const handleUpdate = document => {
      post?.id === document.id && _handleAction("update", document);
    };
    socket.on(`update-${docType}`, handleUpdate);
    socket.on(`filter-${docType}`, handleFilter);

    return () => {
      socket.removeEventListener(`filter-${docType}`, handleFilter);
      socket.removeEventListener(`update-${docType}`, handleUpdate);
    };
  }, [socket, docType, _handleAction, post?.id]);

  if (!docType) stateRef.current.info = "500";
  // if (isEditMode && post && post.user.id !== cid) return <Navigate to={-1} />;
  if (isShort && !isEditMode) return <Navigate to={`/shorts?ref=${id}`} />;

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
    >
      {post === undefined ? (
        <Loading />
      ) : !stateRef.current.info && post?.id ? (
        <>
          {isEditMode ? (
            <InputBox
              showDeleteBtn
              placeholder={isShort ? "Short description" : undefined}
              handleAction={_handleAction}
              placeholders={
                isShort
                  ? {
                      visibility: post.visibility,
                      short: {
                        id: post.id,
                        url: post.url,
                        mimetype: post.mimetype
                      },
                      text: post.text,
                      id: post.id
                    }
                  : {
                      text: post.text,
                      visibility: post.visibility,
                      medias: post.medias,
                      id: post.id
                    }
              }
              url={`/${kind}/${post.id}`}
              multiple={!isShort}
              mediaRefName={isShort ? "short" : "medias"}
              accept={isShort ? "video" : "medias"}
              showIndicator={!isShort}
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
            isRO={post.user?.id === cid || post.rootThread?.user?.id === cid}
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
                  We're sorry, you cannot view this {docType} as the user who
                  owns it has been{" "}
                  {cid ? (
                    <StyledLink to={`/u/${cid}?view=blacklist`}>
                      blacklisted
                    </StyledLink>
                  ) : (
                    "blacklisted"
                  )}
                  . We strive to provide a safe and positive community
                  experience for all our users, and as such, we do not permit
                  access to content owned by blacklisted users
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
                  {{ post: "Post", comment: "Comment" }[docType]} not found or{" "}
                  {docType} visibility has been restricted by the curator.{" "}
                  <StyledLink to="/search?q=all&tab=posts">
                    Find a post here!
                  </StyledLink>
                </>
              }
            />
          ),
          500: <EmptyData maxWidth="300px" label={<>Page not found</>} />
        }[stateRef.current.info] || <EmptyData onClick={fetchDocument} />
      )}
    </MainView>
  );
};

export default Post;
