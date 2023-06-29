export const createError = (message, status) => {
  if (message.status) return message;

  const err = new Error();

  const setDefault = () => {
    err.message =
      typeof message === "string" ? message : "Something went wrong!";
    err.status = status || (message.length ? 400 : 500);
  };

  switch (message.name?.toLowerCase()) {
    case "validationerror":
      err.message = message.message.slice(message.message.lastIndexOf(":") + 2);
      err.status = status || 400;
      break;
    case "casterror":
      err.message = message.message
        .replaceAll(/_id+/g, "id")
        .slice(0, message.message.indexOf(`" for model`));
      err.status = 400;
      break;
    case "customerror":
      err.message = message.message || message;
      err.status = status || 400;
      break;
    case "rangeerror":
    case "referenceerror":
    case "multererror":
      switch (message.code?.toLowerCase()) {
        case "limit_unexpected_file":
          err.message = "File field not found!";
          err.status = 400;
          break;
        default:
          setDefault();
          break;
      }
      break;
    case "fetcherror":
    case "econnreset":
      err.message = "Netowrk error. Check connectivity";
      err.status = 400;
      break;
    default:
      setDefault();
      break;
  }

  if (err.status === 500)
    console.log(
      `[SERVER_ERROR ${message.name || err.name}]: [code:${message.code ||
        err.code}]: ${message.message || err.message}. URL:${
        message.url
      } at ${new Date()}. `
    );

  return err;
};
