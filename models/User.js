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
          type: String,
          ref: "user"
        }
      ],
      default: []
    },
    following: {
      type: [
        {
          type: String,
          ref: "user"
        }
      ],
      default: []
    },
    socials: {},
    bio: String,
    location: String,
    occupation: String,
    recommendationBlacklist: {
      type: Array,
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
    resetDate: Date
  },
  {
    collection: "user",
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
      }
    }
  }
);

// index all string fields
schema.index({ "$**": "text" });
const User = mongoose.model("user", schema);
export default User;
