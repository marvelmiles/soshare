import mongoose from "mongoose";
import { mediaSchema } from "./Media.js";

export const postSchema = mongoose.Schema(
  {
    location: String,
    text: String,
    moreText: String,
    medias: [
      {
        type: mediaSchema,
        default: []
      }
    ],
    likes: {
      type: Map,
      of: Boolean,
      default: {}
    },
    comments: {
      type: Array,
      default: []
    },
    user: {
      type: String,
      ref: "user"
    },
    visibility: {
      type: String,
      set(v) {
        if (v) {
          v = v.toLowerCase();
        }
        return v;
      },
      default: "everyone"
    }
  },
  {
    collection: "post",
    timestamps: true,
    versionKey: false,
    virtuals: true,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);
// index all string fields
postSchema.index({ "$**": "text" });

const Post = mongoose.model("post", postSchema);
export default Post;
