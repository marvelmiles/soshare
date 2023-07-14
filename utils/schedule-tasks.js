import { getAll } from "./index.js";

export const clearGetAllIntervallyTask = (socket, taskKey) => {
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
    (async () => {
      try {
        queryConfig.match._id.$nin = queryConfig.match._id.$nin.concat(
          blacklist
        );
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
