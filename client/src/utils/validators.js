export const isOverflowing = (node = document.documentElement, root) => {
  node = node || document.documentElement;

  let bool = false;
  if (root) {
    bool =
      (node.clientHeight || node.style.height || node.offsetHeight) +
        node.offsetTop >
      (root.clientHeight || root.style.height || root.offsetHeight);
  } else if (node) {
    // const flow = node.style.overflow;
    // node.style.overflow = "hidden";
    bool = node.scrollHeight > node.clientHeight;
    // node.style.overflow = flow;
  }
  return bool;
};

export const isDocVisibleToUser = (document, currentUser = {}) => {
  // document like user don't have user prop
  const { visibility, user = {}, id } = document;

  const uid = user.id || id;

  if (currentUser._disapprovedUsers[uid] || currentUser._blockedUsers[uid])
    return false;

  const { id: cid, following = [] } = currentUser;

  switch (visibility) {
    case "private":
      return cid === uid;
    case "followers only":
      return following.includes(uid);
    default:
      return true;
  }
};

export const isDOMElement = obj => obj instanceof Element;

export const isObject = obj =>
  obj &&
  (typeof obj.toString === "function"
    ? obj.toString() === "[object Object]"
    : typeof obj === "object" && obj.length === undefined);

export const hasAudio = (video, cb, withReset = true, delay = 100) => {
  const muted = video.muted;
  const volume = video.volume;

  const _hasAudio = () =>
    !!(
      video &&
      (!!video.mozHasAudio ||
        video.webkitAudioDecodedByteCount ||
        (video.audioTracks && video.audioTracks.length))
    );

  video.muted = false;
  video.volume = 1;

  const reset = () => {
    video.muted = muted;
    video.volume = volume;
  };

  if (_hasAudio()) {
    reset();
    cb(true);
  } else {
    const id = setTimeout(() => {
      video
        .play()
        .then(_ => {
          const bool = _hasAudio();

          if (withReset) {
            video.pause();
            video.currentTime = 0;
          }
          reset();
          cb(bool);
        })
        .catch(_ => {
          reset();
          cb(false);
        })
        .finally(() => {
          clearTimeout(id);
        });
    }, delay);
  }
};

export const isAtScrollBottom = (
  element = document.documentElement,
  threshold = 1,
  noScroll = false
) => {
  const { scrollTop, scrollHeight, clientHeight } =
    element || document.documentElement;

  if (!scrollTop) return noScroll;

  return Math.ceil(scrollTop) + clientHeight >= scrollHeight * threshold;
};

export const withMapObj = (obj = {}, map = {}, bool) => {
  let withMap;
  for (const key in obj) {
    if (
      // (map[key] !== "Medium password" || map[key] !== "Weak password") &&
      !!map[key] === bool
    ) {
      withMap = true;
      break;
    }
  }
  return withMap;
};
