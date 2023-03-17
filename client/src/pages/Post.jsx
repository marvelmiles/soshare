import React, { useState, useEffect, useCallback } from "react";
import Layout from "components/Layout";
import PostWidget from "components/PostWidget";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Navigate
} from "react-router-dom";
import http from "api/http";
import { useContext } from "redux/store";
import Comments from "components/comments";
import InputBox from "components/InputBox";
import HomePage from "./HomePage";
import MainView from "views/MainView";
import Compose from "pages/Compose";
import { removeFirstItemFromArray } from "utils";
import { Loading } from "components/styled";
import { useSelector } from "react-redux";
const Post = ({ kind = "posts" }) => {
  const cid = useSelector(state => state.user.currentUser?.id);
  const [post, setPost] = useState();
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSnackBar } = useContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = (searchParams.get("edit") || "").toLowerCase() === "true";

  const isShort = kind === "shorts";
  const docType = {
    posts: "post",
    comments: "comment"
  }[kind];
  useEffect(() => {
    (async () => {
      try {
        const post = await http.get(`/${kind}/${id}`, {
          withCredentials: true
        });
        const isEditMode =
          (searchParams.get("edit") || "").toLowerCase() === "true";
        if (isEditMode ? post?.user?.id === cid : true) setPost(post);
        else {
          searchParams.delete("edit");
          setSearchParams(searchParams);
        }
      } catch (message) {
        setSnackBar(message);
      }
    })();
    const timer = setInterval(() => {
      setPost(prev => ({
        ...prev
      }));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [kind, id, setSnackBar, cid, searchParams, setSearchParams]);
  const _handleAction = useCallback((reason, res) => {
    switch (reason) {
      case "filter":
        // navigate(-1);
        break;
      case "filter-comment":
        setPost(post => {
          if (post.comments.length <= post.comments.length - 1) return post;
          return {
            ...post,
            comments: removeFirstItemFromArray(res.uid, post.comments)
          };
        });
        break;
      case "update":
        console.log(" post updating..");
        setPost(post => ({
          ...post,
          ...res
        }));
        break;
      default:
        break;
    }
  }, []);
  // return console.log(post, kind, id, isEditMode);
  if (isShort && !isEditMode) return <Navigate to={`/shorts?ref=${id}`} />;
  if (post === undefined) return <Loading />;
  else if (!post) {
    if (docType === "comment") return <Navigate to={-1} />;
    return <Navigate to={"/"} />;
  }

  return (
    <MainView routePage="profilePage" key={post.id} borderline>
      {isEditMode ? (
        <InputBox
          showDeleteBtn
          placeholder={isShort && "Short description"}
          placeholders={
            isShort
              ? {
                  visibility: post.visibility,
                  short: {
                    id: post.id,
                    url: post.url,
                    mimetype: post.mimetype
                  },
                  text: post.text
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
        />
      )}
      <Comments
        searchParams={isEditMode && `docType=${docType}`}
        docType={!isEditMode && docType}
        showEndElement={true}
        autoFetchReplies={true}
        showRepliesBtn={false}
        documentId={post.id}
        user={post.user}
        handleAction={_handleAction}
        isAuth={post.user.id === cid && isEditMode && docType}
      />
      <Compose
        openFor={{
          comment: true
        }}
      />
    </MainView>
  );
};

export default Post;
