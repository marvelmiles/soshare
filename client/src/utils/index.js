export const removeFirstItemFromArray = (item, array) => {
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

export const handleScrollUp = () =>
  window.scrollTo({ top: 0, behavior: "smooth" });

export const filterDuplicateFromArray = arr => {
  const uniq = [];
  const map = {};
  for (const item of arr) {
    const id = item.id || item._id || item;
    if (!map[id]) {
      map[id] = true;
      uniq.push(item);
    }
  }
  return uniq;
};

export const addToSet = (arr = [], item) => {
  const map = item
    ? {
        [item.id || item._id || JSON.stringify(item)]: true
      }
    : {};
  const items = [];
  item && items.push(item);
  for (const _item of arr) {
    const id = _item.id || _item._id || JSON.stringify(item);
    if (!map[id]) {
      items.push(_item);
      map[id] = id;
    }
  }
  return items;
};
