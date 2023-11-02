import { Server } from "socket.io";
import { createServer } from "http";
import { SUGGEST_FOLLOWERS_TASK_KEY, SUGGESTED_USERS } from "./config.js";
import { verifyToken, validateCors } from "./utils/middlewares.js";
import { createError } from "./utils/error.js";
import { clearGetAllIntervallyTask } from "./utils/schedule-tasks.js";
import cookie from "cookie";

export default (app, port = process.env.PORT || 8800) => {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: validateCors,
      credentials: true
    },
    path: "/soshare"
  });

  app.set("socketIo", io);

  io.use((socket, next) => {
    const _cookie = socket.request.headers.cookie;

    const cookies = _cookie
      ? typeof _cookie === "string"
        ? cookie.parse(_cookie)
        : _cookie
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
    } else {
      socket.emit("bare-connection");
    }

    socket.on("disconnect-suggest-followers-task", () =>
      clearGetAllIntervallyTask(socket, SUGGEST_FOLLOWERS_TASK_KEY)
    );

    socket.on("disconnect", () => {
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
