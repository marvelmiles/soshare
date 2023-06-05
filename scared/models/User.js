import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    displayName: String,
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      min: 8
    },
    photoUrl: String,
    followers: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "user"
        }
      ],
      default: []
    },
    following: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "user"
        }
      ],
      default: []
    },
    socials: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    bio: String,
    location: String,
    occupation: String,
    recommendationBlacklist: {
      type: [{ type: mongoose.Types.ObjectId, ref: "user" }],
      default: []
    },
    lastLogin: Date,
    isLogin: {
      type: Boolean,
      set(v) {
        v && (this.lastLogin = new Date());
        return v;
      }
    },
    provider: String,
    resetToken: String,
    resetDate: Date,
    shortCount: {
      type: Number,
      default: 0
    },
    postCount: {
      type: Number,
      default: 0
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    collection: "user",
    timestamps: true,
    versionKey: false,
    toJSON: {
      minimize: false,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        if (ret.settings) delete ret.settings._id;
        if (ret.socials) delete ret.socials._id;

        ret.blacklistCount =
          doc.blacklistCount === undefined && doc.recommendationBlacklist
            ? doc.recommendationBlacklist.length
            : doc.blacklistCount;
      }
    }
  }
);

// index all string fields
schema.index({ "$**": "text" });
const User = mongoose.model("user", schema);
export default User;