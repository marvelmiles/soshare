import { getAll } from "./index.js";
import { SUGGESTED_USERS } from "../config.js";

export const clearGetAllIntervallyTask = (socket, taskKey) => {
  socket.removeAllListeners("suggest-followers");
  clearInterval(socket.handshake[taskKey]);
  delete socket.handshake[taskKey];
};
export const getAllIntervally = (
  queryConfig,
  socket,
  nextCursor,
  taskKey,
  options = {}
) => {
  clearGetAllIntervallyTask(socket, taskKey);

  let { blacklist = [], eventName, delay = 3600, mapFn } = options;

  socket.on("suggest-followers", user => (blacklist = blacklist.concat(user)));
  socket.handshake[taskKey] = setInterval(() => {
    return;
    (async () => {
      try {
        queryConfig.match._id.$nin = blacklist.concat(
          queryConfig.match._id.$nin || [],
          socket.handshake[SUGGESTED_USERS] || []
        );

        socket.handshake[SUGGESTED_USERS] = [];

        queryConfig.query = {
          ...queryConfig.query,
          cursor: nextCursor
        };

        const result = await getAll(queryConfig);
        eventName && socket.emit(eventName, result);

        blacklist = blacklist.concat(
          mapFn ? result.data.map(mapFn) : result.data
        );
        nextCursor = result.paging.nextCursor;
      } catch (err) {
        console.log(
          `[SERVER_WARNING: getAllIntervally] ${err.message}. ${JSON.stringify({
            nextCursor,
            taskKey,
            match: queryConfig.match,
            query: queryConfig.query
          })} at ${new Date()}`
        );
      }
    })();
  }, delay);
};
