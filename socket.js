import { Server } from "socket.io";
import { createServer } from "http";
import events from "events";
import { CLIENT_ENDPOINT } from "./config.js";
import User from "./models/User.js";

export default (app, port = process.env.PORT || 8800) => {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ENDPOINT
    },
    path: "/mernsocial"
  });

  io.on("connection", socket => {
    console.log(socket.id, socket.userId, " socket connected ");
    !socket.userId && io.emit("register-user");
    const ev = new events.EventEmitter();
    socket.on("register-user", (id, overrideUserId = false) => {
      if (id) {
        if (overrideUserId || !socket.userId) socket.userId = id;
        socket.leave(id);
        socket.join(id);
      }
    });

    app.set("socketIo", io);
    app.set("event", ev);
    ev.on("schedule-suggest-followers", () => {
      socket.suggestTask = setInterval(() => {
        (async () => {
          // console.log(socket.userId, " socket user id");
          if (socket.userId)
            io.to(socket.userId).volatile.emit(
              "suggest-followers",
              await User.find({
                _id: {
                  $ne: socket.userId,
                  $nin: (await User.findById(socket.userId)).following
                }
              })
            );
        })();
      }, 1000 * 60);
    });
    socket.on("disconnect", () => {
      console.log("disconnected socket ", socket.id);
      socket.leave(socket.userId);
      delete socket.userId;
      ev.removeAllListeners("suggest-followers");
      if (socket.suggestTask) clearInterval(socket.suggestTask);
    });
  });
  httpServer.listen(port, () => console.log(`App listening on port ${port}`));
};
