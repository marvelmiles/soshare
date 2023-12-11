import { Schema } from "mongoose";

export const mediaSchema = new Schema(
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
);
