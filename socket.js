import { Server } from "socket.io";
import { createServer } from "http";
import { CLIENT_ENDPOINT } from "./config.js";
import cookie from "cookie";
import { verifyToken } from "./utils/middlewares.js";
import { createError } from "./utils/error.js";
import User from "./models/User.js";
import { Types } from "mongoose";

export default (app, port = process.env.PORT || 8800) => {
  (async () => {
    // Find all users
    const users = await User.find();
    // Iterate over each user
    for (const user of users) {
      // Convert following array elements to ObjectId
      user.following = user.following.map(id => new Types.ObjectId(id));

      // Convert followers array elements to ObjectId
      user.followers = user.followers.map(id => new Types.ObjectId(id));

      // Save the updated user document
      await User.updateOne(
        {
          _id: user.id
        },
        user
      );
    }
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
    try {
      if (cookies)
        verifyToken({
          cookies
        });
      socket.handshake.withCookies = true;
      next();
    } catch (err) {
      if (socket.handshake.userId) socket.disconnect();
      next(createError(cookies ? `Token expired or isn't valid` : err.message));
    }
  });
  io.on("connection", socket => {
    if (socket.handshake.withCookies) {
      !socket.handshake.userId && io.emit("register-user");
      socket.on("register-user", (id, cb) => {
        if (id) {
          socket.handshake.userId = id;
          socket.join(id);
          typeof cb === "function" && cb();
        }
      });
    }
    socket.on("disconnect", () => {
      socket.leave(socket.handshake.userId);

      if (socket.handshake.suggestFollowersTime)
        clearTimeout(socket.handshake.suggestFollowersTime);

      if (socket.handshake.suggestFollowersInterval)
        clearInterval(socket.handshake.suggestFollowersInterval);
      delete socket.handshake.withCookies;
      delete socket.handshake.userId;
      delete socket.handshake.suggestFollowersTime;
      delete socket.handshake.suggestFollowersInterval;
    });
  });
  httpServer.listen(port, () => console.log(`App listening on port ${port}`));
};
