export const isOverflowing = (node = document.documentElement, root) => {
  let bool = false;
  if (root) {
    bool =
      (node.clientHeight || node.style.height || node.offsetHeight) +
        node.offsetTop >
      (root.clientHeight || root.style.height || root.offsetHeight);
  } else if (node) {
    const flow = node.style.overflow;
    node.style.overflow = "hidden";
    bool = node.scrollHeight > node.clientHeight;
    node.style.overflow = flow;
  }
  return bool;
};

export const checkVisibility = (
  { visibility, user: { id: uid } },
  { id: cid, following }
) => {
  switch (visibility) {
    case "everyone":
      return true;
    case "private":
      return cid === uid;
    case "followers only":
      return following.includes(uid);
    default:
      return false;
  }
};

export const isDOMElement = obj => obj instanceof Element;

export const isObject = obj =>
  obj &&
  (typeof obj.toString === "function"
    ? obj.toString() === "[object Object]"
    : typeof obj === "object" && obj !== null && obj.length === undefined);
