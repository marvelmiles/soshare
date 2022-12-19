import mongoose from "mongoose";

const schema = mongoose.Schema(
  {
    location: String,
    text: String,
    medias: Array,
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
      ref: "users"
    },
    visibility: {
      type: String,
      default: "everyone"
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

const Post = mongoose.model("posts", schema);

export default Post;
