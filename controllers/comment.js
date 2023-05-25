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
import { sendAndUpdateNotification, handleMiscDelete } from "../utils/index.js";
import { mergeThread } from "../utils/serializers.js";

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
      req.body.rootThread = rootThread || document;
      req.body.rootType = rootType || docType;
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
    ];
    comment = await comment.populate([
      {
        path: "user"
      },
      {
        path: "document",
        populate: docPopulate
      }
    ]);
    res.json(comment);
    await sendAndUpdateNotification({
      req,
      type: "comment",
      document: comment,
      reportIds: {
        like: likes,
        comment: comments
      },
      docPopulate
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
  getFeedMedias({
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
    ]
  });
};

export const deleteComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);
    const isOwner = comment.user === req.user.id;
    if (!isOwner) {
      if (req.query.ro) {
        if (req.query.ro !== req.user.id)
          throw createError("Delete operation denied", 401);
      } else throw createError("Delete operation denied", 401);
    }
    const populate = [
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
    ];

    comment = await Comment.findByIdAndDelete({ _id: req.params.id });
    res.json(
      isOwner
        ? "You permanently deleted your comment"
        : "Comment deleted successfully"
    );
    const model = {
      post: Post,
      comment: Comment
    }[comment.docType];
    await model.updateOne(
      {
        _id: comment.document.id
      },
      {
        comments: removeFirstItemFromArray(
          req.user.id,
          (await model.findOne({
            _id: comment.document.id
          }))?.comments
        )
      }
    );
    comment = await comment.populate(populate);
    const io = req.app.get("socketIo");
    if (io) {
      io && io.emit(`filter-comment`, doc);
      if (
        req.query.withThread === "true" &&
        (req.query.ro || req.query.threadPriorities)
      ) {
        const doc = await mergeThread(
          Comment,
          comment.document.id,
          req.query,
          populate
        );
        if (doc) io.emit("comment", doc, true);
      }
    }
    handleMiscDelete(comment.id, io);
    if (comment.media) deleteFile(comment.media.url);
  } catch (err) {
    next(err);
  }
};

export const likeComment = (req, res, next) =>
  likeMedia(Comment, req, res, next);

export const dislikeComment = (req, res, next) =>
  dislikeMedia(Comment, req, res, next);
