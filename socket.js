import { Server } from "socket.io";
import { createServer } from "http";
import { CLIENT_ENDPOINT } from "./config.js";
import cookie from "cookie";
import { verifyToken } from "./utils/middlewares.js";
import { createError } from "./utils/error.js";
import User from "./models/User.js";
import { Types } from "mongoose";
import Comment from "./models/Comment.js";
import Post from "./models/Post.js";
import Short from "./models/Short.js";

export default (app, port = process.env.PORT || 8800) => {
  (async () => {
    // const posts = await Short.find({
    //   // user: "647bfecf807e097cf56a64a1"
    // });
    // for (let i = 0; i < posts.length / 2; i++) {
    //   const post = posts[Math.floor(Math.random() * posts.length)];
    //   await post.updateOne({
    //     user: "6436e0e74bdec4961bc0680b",
    //     comments: [],
    //     likes: {}
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
    //       $unset: { postCount: 1, shortCount: 1 } // Updated field names: postCount and shortCount
    //     }
    //   );
    // }
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
    const cookies = cookie.parse(socket.request.headers.cookie || "");
    // console.log(cookies)
    try {
      if (cookies) {
        verifyToken({
          cookies
        });
        socket.handshake.withCookies = true;
      }
      next();
    } catch (err) {
      if (socket.handshake.userId) socket.disconnect();
      const withCredentials = !!socket.request;
      // console.log(!!cookies.access_token);
      next(
        cookies.access_token
          ? createError(
              cookies ? `Token expired or isn't valid` : err.message,
              err.status || 401
            )
          : undefined
      );
    }
  });
  io.on("connection", socket => {
    const handleRegUser = (id, cb) => {
      if (id) {
        socket.handshake.userId = id;
        socket.join(id);
        typeof cb === "function" && cb();
      } else socket.emit("bare-connection");
    };

    const stopSuggestFollowersTask = () => {
      if (socket.handshake.suggestFollowersTime)
        clearTimeout(socket.handshake.suggestFollowersTime);

      if (socket.handshake.suggestFollowersInterval)
        clearInterval(socket.handshake.suggestFollowersInterval);

      delete socket.handshake.suggestFollowersTime;
      delete socket.handshake.suggestFollowersInterval;
    };

    if (socket.handshake.withCookies) {
      !socket.handshake.userId && io.emit("register-user");
      socket.on("register-user", handleRegUser);
    } else socket.emit("bare-connection");

    socket.on("disconnect-suggest-followers-task", stopSuggestFollowersTask);

    socket.on("disconnect", () => {
      console.clear();

      socket.removeAllListeners();

      socket.leave(socket.handshake.userId);

      stopSuggestFollowersTask();

      delete socket.handshake.withCookies;
      delete socket.handshake.userId;
    });
  });
  httpServer.listen(port, () => console.log(`App listening on port ${port}`));
};
