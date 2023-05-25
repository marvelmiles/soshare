export const createError = (message, status) => {
  if (message.status) return message;
  const err = new Error();
  switch (message.name?.toLowerCase()) {
    case "validationerror":
      err.message = message.message.slice(message.message.lastIndexOf(":") + 2);
      err.status = status || 400;
      break;
    case "casterror":
      err.message = message.message
        .replaceAll(/_id+/g, "id")
        .slice(0, message.message.indexOf(`" for model`));
      err.status = 409;
      break;
    case "customerror":
      err.message = message.message || message;
      err.status = status || 400;
      break;
    case "rangeerror":
    case "referenceerror":
    default:
      err.message =
        typeof message === "string" ? message : "Something went wrong!";
      err.status = status || (message.length ? 400 : 500);
      break;
  }
  return err;
};
