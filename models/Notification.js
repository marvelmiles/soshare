import mongoose from "mongoose";
import { mediaSchema } from "./Media.js";

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["follow", "like", "comment", "delete"]
    },
    to: {
      type: String,
      ref: "user"
    },
    users: [
      {
        type: String,
        ref: "user"
      }
    ],
    marked: {
      type: Boolean,
      default: false
    },
    document: {
      type: String,
      refPath: "docType"
    },
    docType: {
      type: String,
      required: function() {
        return !!this.document;
      }
    },
    cacheType: String,
    cacheDocs: [
      {
        type: new mongoose.Schema({
          text: String,
          media: mediaSchema
        })
      }
    ],
    expireAt: Date
  },
  {
    collection: "notification",
    versionKey: false,
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.filter;
      }
    }
  }
);

schema.index({ createdAt: 1 });

export default mongoose.model("notification", schema);
