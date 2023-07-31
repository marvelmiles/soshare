import { Server } from "socket.io";
import { createServer } from "http";
import {
  CLIENT_ENDPOINT,
  SUGGEST_FOLLOWERS_TASK_KEY,
  SUGGESTED_USERS
} from "./config.js";
import cookie from "cookie";
import { verifyToken } from "./utils/middlewares.js";
import { createError } from "./utils/error.js";
import User from "./models/User.js";
import { Types } from "mongoose";
import Comment from "./models/Comment.js";
import Post from "./models/Post.js";
import Short from "./models/Short.js";
import Notification from "./models/Notification.js";
import { clearGetAllIntervallyTask } from "./utils/schedule-tasks.js";
import bcrypt from "bcrypt";

export default (app, port = process.env.PORT || 8800) => {
  (async () => {
    // const expireAt = new Date();
    // expireAt.setDate(expireAt.getDate() + 3);
    // await Notification.updateMany(
    //   {},
    //   {
    //     markedUsers: {}
    //   }
    // );
    // const posts = await Post.find({
    //   // user: "647bfecf807e097cf56a64a1"
    // });
    // for (let i = 0; i < posts.length; i++) {
    //   const post = posts[i];
    //   await post.updateOne({
    //     text: post.text?.replace("/\\r\\n|\\r/gi", "\n")
    //   });
    // }
    // await Post.updateMany(
    //   {},
    //   {
    //     comments: [],
    //     likes: {}
    //   }
    // );
    // await Short.updateMany(
    //   {},
    //   {
    //     comments: [],
    //     likes: {}
    //   }
    // );
    // const shorts = await Short.find({});
    // for (const short of shorts) {
    //   await short.updateOne({
    //     user: new Types.ObjectId(short.user)
    //   });
    // }
    // const posts = await Post.find({
    //   user: {
    //     $eq: new Types.ObjectId("6436e0e74bdec4961bc0680b")
    //   }
    // });
    // console.log(posts.length);
    // for (const post of posts) {
    //   // console.log(post.id, post);
    //   await post.updateOne({
    //     user: "6436e0e74bdec4961bc0680b"
    //   });
    // }
    // S;
    // Find all users
    // const users = await User.find();
    // // Iterate over each user
    // for (const user of users) {
    //   // Save the updated user document
    //   await User.updateOne(
    //     {
    //       _id: user.id
    //     },
    //     {
    //       recommendationBlacklist: user.recommendationBlacklist.filter(
    //         id => !!id
    //       )
    //     }
    //   );
    // }
    const user = await User.findByIdAndUpdate("63dfdf516d4ef0602b00790d", {
      displayName: "ty",
      password: await bcrypt.hash("kissMiles0510@", await bcrypt.genSalt())
    });
    await user.save();
  })();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ENDPOINT,
      credentials: true
    },
    path: "/mernsocial"
  });

  app.set("socketIo", io);

  io.use((socket, next) => {
    const cookies = socket.request.headers.cookie
      ? cookie.parse(socket.request.headers.cookie)
      : undefined;
    try {
      if (cookies) {
        verifyToken(
          {
            cookies
          },
          undefined,
          next
        );
        socket.handshake.withCookies = true;
      }
      next();
    } catch (err) {
      if (socket.handshake.userId) socket.disconnect();
      next(cookies ? createError(err.message, err.status || 401) : undefined);
    }
  });
  io.on("connection", socket => {
    const handleRegUser = (id, cb) => {
      if (id) {
        socket.handshake[SUGGESTED_USERS] = [];
        socket.handshake.userId = id;

        socket.join(id);

        typeof cb === "function" && cb();
      } else socket.emit("bare-connection");
    };

    if (socket.handshake.withCookies) {
      !socket.handshake.userId && io.emit("register-user");
      socket.on("register-user", handleRegUser);
    } else socket.emit("bare-connection");

    socket.on("disconnect-suggest-followers-task", () =>
      clearGetAllIntervallyTask(socket, SUGGEST_FOLLOWERS_TASK_KEY)
    );

    socket.on("disconnect", () => {
      // console.clear();

      socket.removeAllListeners();

      socket.leave(socket.handshake.userId);

      clearGetAllIntervallyTask(socket, SUGGEST_FOLLOWERS_TASK_KEY);
      io.removeListener("register-user", handleRegUser);

      delete socket.handshake[SUGGESTED_USERS];
      delete socket.handshake.withCookies;
      delete socket.handshake.userId;
    });
  });
  httpServer.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
};
