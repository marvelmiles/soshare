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
      type: Array,
      default: []
    },
    following: {
      type: Array,
      default: []
    },
    socials: Object,
    aboutMe: String,
    location: String,
    occupation: String,
    viewes: {
      type: Number,
      defualt: 0
    },
    impressions: { type: Number, default: 0 },
    lastLogin: Date,
    isLogin: {
      type: Boolean,
      set(v) {
        v && (this.lastLogin = new Date());
        return v;
      }
    }
  },
  {
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

export default mongoose.model("users", schema);
