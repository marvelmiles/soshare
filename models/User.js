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
      required: true,
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

    location: String,
    occupation: String,
    viewedProfile: Number,
    impressions: Number
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
