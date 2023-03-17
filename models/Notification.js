import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    reports: {
      type: Map,
      of: {},
      default: {}
    },
    type: String,
    from: {
      type: String,
      ref: "user"
    },
    to: {
      type: String,
      ref: "user"
    },
    foreignKey: String,
    document: {
      type: String,
      refPath: "docType"
    },
    docType: {
      type: String,
      required: function() {
        return !!this.document;
      }
    }
  },
  {
    collection: "notification",
    timestamps: true,
    versionKey: false,
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
