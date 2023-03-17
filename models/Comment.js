import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: "user",
      required: true
    },
    rootThread: {
      type: String,
      refPath: "rootType"
    },
    rootType: {
      type: String,
      required() {
        return this.rootThread ? "Comment root type is required" : false;
      }
    },
    document: {
      type: String,
      refPath: "docType"
    },
    docType: {
      type: String,
      required() {
        return this.document ? "Comment doc type is required" : false;
      }
    },
    threads: [
      {
        type: String,
        ref: "comment",
        default: []
      }
    ],
    visibility: {
      type: String,
      default: "everyone"
    },
    text: {
      type: String,
      required() {
        return this.text
          ? false
          : this.media
          ? false
          : "comment text or media is required";
      }
    },
    media: {
      type: new mongoose.Schema(
        {
          url: {
            type: String,
            required: "media url is required"
          },
          mimetype: {
            type: String,
            required: "media mimetype is required"
          }
        },
        { _id: false, id: false }
      ),
      required() {
        return this.media
          ? false
          : this.text
          ? false
          : "comment text or media is required";
      }
    },
    edited: {
      type: Boolean,
      default: false
    },
    likes: {
      type: Map,
      of: Boolean,
      default: {}
    },
    comments: {
      type: [
        {
          type: String,
          ref: "user"
        }
      ],
      ref: "user",
      default: []
    }
  },
  {
    collection: "comment",
    timestamps: true,
    versionKey: false,
    toJSON: {
      versionKey: false,
      virtuals: true,
      transform: function(doc, ret) {
        // console.log("tranform comment ");
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);
export default mongoose.model("comment", schema);
