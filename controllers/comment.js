import { createError } from "../utils/error.js";
import Comment from "../models/Comment.js";
import { deleteFile } from "../utils/fileHandler.js";
import Post from "../models/Post.js";
import {
  getFeedMedias,
  removeFirstItemFromArray,
  sendAndUpdateNotification,
  likeMedia,
  dislikeMedia,
  createVisibilityQuery
} from "../utils/index.js";
import { verifyToken } from "./auth.js";
export const addComment = async (req, res, next) => {
  try {
    console.log("adding comment", req.params);
    if (!req.body.document)
      throw createError(
        "Invalid body expect document key value pair of type string"
      );
    let model;

    if (
      !req.params.docType ||
      !(model = {
        post: Post,
        comment: Comment
      }[(req.params.docType = req.params.docType.toLowerCase())])
    )
      throw createError(
        `Invalid docType: Expect post|comment of type string got type ${typeof req
          .params.docType}`
      );
    req.body.user = req.user.id;
    req.body.docType = req.params.docType;
    if (req.file) {
      req.body.media = {
        url: req.file.publicUrl,
        mimetype: req.file.mimetype
      };
    }
    const {
      threads = [],
      document,
      docType,
      comments = [],
      likes,
      rootThread,
      rootType
    } =
      (await model.findOneAndUpdate(
        {
          _id: req.body.document
        },
        {
          $push: {
            comments: req.body.user
          }
        },
        { new: true }
      )) || {};
    if (!likes) throw createError("Comment not found", 404);
    if (req.params.docType === "comment") {
      req.body.threads = [req.body.document, ...threads];
      if (docType !== "comment") {
        req.body.rootThread = rootThread || document;
        req.body.rootType = rootType || docType;
      }
    }
    let comment = await new Comment(req.body).save();
    comment = await comment.populate([
      {
        path: "user"
      },
      {
        path: "document",
        populate: [
          {
            path: "user"
          },
          {
            path: "threads",
            populate: [
              { path: "user" },
              {
                path: "document",
                populate: [
                  {
                    path: "user"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        path: "threads",
        populate: [
          { path: "user" },
          {
            path: "document",
            populate: [
              {
                path: "user"
              }
            ]
          }
        ]
      }
    ]);
    console.log("done saving comment...");
    res.json(comment);
    sendAndUpdateNotification({
      req,
      type: "comment",
      document: comment.id,
      reportIds: {
        like: likes,
        comment: comments
      },
      docPopulate: [
        {
          path: "document"
        },
        {
          path: "threads"
        }
      ]
    });
  } catch (err) {
    console.log("comment has error");
    next(err);
    req.file && deleteFile(req.file.publicUrl);
  }
};

export const getComment = async (req, res, next) => {
  try {
    verifyToken(req, { _noNext: true, throwErr: false });
    const query = await createVisibilityQuery(req.user?.id);
    query._id = req.params.id;
    res.json(
      await Comment.findOne(query).populate([
        {
          path: "user document"
        },
        {
          path: "threads",
          populate: "user"
        }
      ])
    );
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  console.log("getting comments", req.params.documentId);
  req.query.shuffle = req.query.shuffle || "false";

  return getFeedMedias({
    model: Comment,
    req,
    res,
    next,
    populate: [
      {
        path: "user"
      },
      {
        path: "document",
        populate: [
          {
            path: "user"
          },
          {
            path: "threads",
            populate: [
              { path: "user" },
              {
                path: "document",
                populate: [
                  {
                    path: "user"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        path: "threads",
        populate: [
          { path: "user" },
          {
            path: "document",
            populate: [
              {
                path: "user"
              }
            ]
          }
        ]
      }
    ],
    match: {
      document: req.params.documentId
    },
    validateDoc: req.query.docType
  });
};

export const deleteComment = async (req, res, next) => {
  try {
    // console.log(req.user, req.params, "del ");
    if (req.query.userId) {
      const {} = await Comment.findOne({
        user: req.user.id
      });
    } else {
    }
    const { docType, document, user } = await Comment.findByIdAndDelete(
      req.params.id
    );
    const isOwner = user === req.user.id;
    await Comment.deleteMany({
      $or: [
        { document: req.params.id },
        {
          rootThread: req.params.id
        }
      ]
    });
    const model = {
      post: Post,
      comment: Comment
    }[docType];
    await model.updateOne(
      {
        _id: document
      },
      {
        comments: removeFirstItemFromArray(
          req.user.id,
          (await model.findOne({
            _id: document
          })).comments
        )
      }
    );
    res.json(
      isOwner
        ? "You have permanently deleted your comment"
        : "Comment deleted successfully"
    );
    const io = req.app.get("socketIo");
    if (io) io.volatile.emit("delete-comment", req.params.id, document);
  } catch (err) {
    next(err);
  }
};

export const likeComment = (req, res, next) =>
  likeMedia(Comment, req, res, next);

export const dislikeComment = (req, res, next) =>
  dislikeMedia(Comment, req, res, next);
