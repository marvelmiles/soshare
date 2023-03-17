import mongoose from "mongoose";

const schema = mongoose.Schema(
  {
    text: String,
    url: {
      type: String,
      required: "Short media url is required"
    },
    mimetype: {
      type: String,
      required: function() {
        return this.url ? "Short mimetype is required" : false;
      }
    },
    views: {
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
      default: "everyone"
    }
  },
  {
    collection: "short",
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

// index all string fields
schema.index({ text: 1 });
schema.index(
  {
    expireAt: 1
  },
  { expireAfterSeconds: 0 }
);
const Short = mongoose.model("short", schema);

export default Short;
