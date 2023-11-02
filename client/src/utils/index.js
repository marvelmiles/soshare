export const removeFirstItemFromArray = (item, array = []) => {
  for (let i = 0; i < array.length; i++) {
    if (item === array[i]) {
      array.splice(i, 1);
      break;
    }
    continue;
  }
  return array;
};

export const mapValidItems = (arr, container) => {
  const maps = [];
  if (Array.isArray(arr))
    for (const item of arr) {
      const m = container.find(
        _item => (_item.id || _item) === (item.id || item)
      );
      if (m) maps.push(m);
    }
  return maps;
};

export const reloadBrowser = e => {
  e.stopPropagation();
  window.location.reload();
};

export const handleScrollUp = (eOrNode = window) => {
  (eOrNode.nodeName
    ? eOrNode
    : eOrNode.stopPropagation &&
      (eOrNode.stopPropagation() ||
        eOrNode.currentTarget.dataset.scroll !== "true")
    ? window
    : eOrNode
  ).scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

export const addToSet = (arr = [], item, set = {}) => {
  const items = [];

  if (item) {
    set[item.id || item] = true;
    items.push(item);
  }

  for (const _item of arr) {
    const id = _item.id || _item;

    if (!set[id]) {
      set[id] = true;
      items.push(_item);
    }
  }
  return items;
};

export const filterDocsByUserSet = (
  infiniteScrollUtils,
  usersSet,
  subPath,
  stateCtx
) => {
  const { data, setData } = infiniteScrollUtils;
  const arr = [];
  for (let i = 0; i < data.data.length; i++) {
    const doc = data.data[i];
    const deleteFromReg = doc => {
      delete stateCtx.registeredIds[doc.id];

      if (doc[subPath])
        for (const { id } of doc[subPath]) {
          delete stateCtx.registeredIds[id];
        }
    };

    if (doc.user && usersSet[doc.user.id]) {
      const doc = data.data[i];
      stateCtx?.registeredIds && deleteFromReg(doc);
    } else arr.push(doc);

    if (doc[subPath])
      for (let i = 0; i < doc[subPath].length; i++) {
        if (usersSet[doc[subPath][i].user.id]) {
          const array = doc[subPath].splice(i);
          stateCtx?.registeredIds && array.forEach(deleteFromReg);
          break;
        }
      }
  }
  setData({
    ...data,
    data: arr
  });
};

export const setAspectRatio = element => {
  let ratio =
    (element.naturalWidth || element.videoWidth) /
    (element.naturalHeight || element.videoHeight);
  ratio = ratio > 1 ? 1 / ratio : ratio;
  element.parentElement.style.paddingBottom = 100 * ratio + "%";
};

export const getTimeMap = duration => {
  const secs = Math.floor(duration);
  return { mins: Math.floor(secs / 60), secs: secs % 60 };
};

export const mapToObject = (arr = [], has) => {
  const map = {};
  for (let i = 0; i < arr.length; i++) {
    const key = arr[i].id || arr[i];
    map[key] = { true: true, index: i }[has] || arr[i];
  }
  return map;
};
