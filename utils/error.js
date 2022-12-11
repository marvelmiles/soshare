export const createError = (message, status) => {
  const err = new Error();
  err.status = status || 400;
  err.message = message;
  return err;
};
