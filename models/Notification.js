import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["follow", "like", "comment"]
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
    expireAt: Date,
    markedUsers: {
      type: Map,
      of: Boolean,
      default: {}
    }
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
schema.index(
  {
    expireAt: 1
  },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("notification", schema);
