import { createError } from "../utils/error.js";
import Comment from "../models/Comment.js";
import { deleteFile } from "../utils/file-handlers.js";
import Post from "../models/Post.js";
import {
  getFeedMedias,
  likeMedia,
  dislikeMedia,
  getDocument
} from "../utils/req-res-hooks.js";
import { removeFirstItemFromArray } from "../utils/normalizers.js";
import {
  sendAndUpdateNotification,
  handleMiscDelete,
  getThreadsByRelevance
} from "../utils/index.js";

export const addComment = async (req, res, next) => {
  try {
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
    const { _id, likes, rootThread, rootType } =
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
      req.body.rootThread = rootThread || _id;
      req.body.rootType = rootType || model.modelName;
    }
    let comment = await new Comment(req.body).save();
    const docPopulate = [
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
            path: "document",
            populate: "user"
          }
        ]
      }
    ];
    comment = await comment.populate(docPopulate);
    const io = req.app.get("socketIo");
    if (io) {
      io.emit("comment", comment);
      io.emit(`update-${comment.docType}`, comment.document);
    }
    res.json(comment);
    sendAndUpdateNotification({
      req,
      docPopulate,
      type: "comment",
      document: comment
    });
  } catch (err) {
    next(err);
  }
};

export const getComment = async (req, res, next) => {
  return getDocument({ req, res, next, model: Comment });
};

export const getComments = async (req, res, next) => {
  req.query.shuffle = req.query.shuffle || "false";

  const docPopulate = [
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
          path: "document",
          populate: "user"
        }
      ]
    }
  ];
  getFeedMedias({
    model: Comment,
    req,
    res,
    next,
    populate: docPopulate
  });
};

export const deleteComment = async (req, res, next) => {
  try {
    const docPopulate = [
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
            path: "document",
            populate: "user"
          }
        ]
      }
    ];
    let comment = await Comment.findById(req.params.id).populate(docPopulate);

    if (!comment) return res.json("Comment deleted successfully");

    const isOwner = comment.user.id === req.user.id;
    let withRo;
    if (!isOwner) {
      if (!req.query.ro || req.query.ro !== req.user.id)
        throw createError("Delete operation denied", 401);
      else withRo = true;
    }

    await Comment.deleteOne({ _id: req.params.id });

    res.json(
      isOwner
        ? "You permanently deleted your comment"
        : "Comment deleted successfully"
    );

    const model = {
      post: Post,
      comment: Comment
    }[comment.docType];

    if (comment.document) {
      const comments = removeFirstItemFromArray(
        req.user.id,
        comment.document.comments
      );
      comment.document.comments = comments;
      await model.updateOne(
        {
          _id: comment.document.id
        },
        {
          comments
        }
      );
    }
    const io = req.app.get("socketIo");
    if (io) {
      io.emit(`filter-comment`, comment);
      io.emit(`update-${model.modelName}`, comment.document);

      if (
        comment.rootThread &&
        req.query.withThread === "true" &&
        (req.query.ro || req.query.threadPriorities)
      ) {
        const threads = await getThreadsByRelevance(
          comment.rootThread,
          req.query,
          model,
          true
        );
        if (threads.length) io.emit("comment", threads, true);
      }
    }

    handleMiscDelete(comment.id, io, {
      $or: [
        {
          cacheDocs: {
            $elemMatch: {
              _id: comment.id
            }
          }
        }
      ],
      cb() {
        withRo &&
          sendAndUpdateNotification({
            req,
            docPopulate,
            type: "delete",
            cacheDoc: {
              _id: comment._id,
              text: comment.text,
              media: comment.media
            },
            cacheType: "comment",
            document: comment.rootThread?.id || comment.document?.id,
            docType: comment.rootType || comment.docType,
            to: comment.user.id
          });
      }
    });
    if (comment.media) deleteFile(comment.media.url);
  } catch (err) {
    console.log(err.message, " err msg ");
    next(err);
  }
};

export const likeComment = (req, res, next) =>
  likeMedia(Comment, req, res, next);

export const dislikeComment = (req, res, next) =>
  dislikeMedia(Comment, req, res, next);
