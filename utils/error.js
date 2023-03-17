export const createError = (message, status) => {
  if (message.status) return message;
  const err = new Error();
  switch (message.name?.toLowerCase()) {
    case "validationerror":
      err.message = message.message.slice(message.message.lastIndexOf(":") + 2);
      err.status = status || 400;
      break;
    default:
      err.message =
        message.message ||
        (message.length && message) ||
        "Something went wrong!";
      err.status = status || (message.length ? 400 : 500);
      break;
  }
  return err;
};
