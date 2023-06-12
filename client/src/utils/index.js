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

export const handleScrollUp = e =>
  (e && e.target.dataset.scroll !== "disable" ? e.target : window).scrollTo({
    top: 0,
    behavior: "smooth"
  });

export const addToSet = (arr = [], item, set = {}) => {
  item = item && (item.id || item._id || JSON.stringify(item));
  item && (set[item] = true);
  const items = [];
  item && items.push(item);
  for (const _item of arr) {
    const id = _item.id || _item._id || JSON.stringify(item);
    if (!set[id]) {
      items.push(_item);
      set[id] = true;
    }
  }
  return items;
};
