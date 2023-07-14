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
  currentUser = {}
) => {
  const { id: cid, following = [] } = currentUser;
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
    : typeof obj === "object" && obj.length === undefined);

export const hasAudio = (video, cb) => {
  const _hasAudio = () =>
    !!(
      video &&
      (!!video.mozHasAudio ||
        video.webkitAudioDecodedByteCount ||
        (video.audioTracks && video.audioTracks.length))
    );

  if (_hasAudio()) cb(true);
  else {
    const _id = setTimeout(() => {
      video.play().catch(_ => {});
      const id = setTimeout(() => {
        video.pause();
        video.currentTime = 0;
        clearTimeout(id);
        cb(_hasAudio());
      }, 100);
      clearTimeout(_id);
    }, 0);
  }
};
