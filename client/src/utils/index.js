export const removeFileFromFileList = (index, input) => {
  const dt = new DataTransfer();
  const { files } = input;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (index !== i) dt.items.add(file);
  }
  input.files = dt.files;
};

export const getScrollAtIndexes = e => {
  const t = e.currentTarget || e.target;
  const scrollAtIndex =
    Math.floor(
      (t ? t.scrollTop : window.scrollY) /
        (t || e).firstElementChild.clientHeight
    ) || 0;
  const initNoOfItemsViewed =
    Math.floor(
      (t ? t.clientHeight : window.innerHeight) /
        (t || e).firstElementChild.clientHeight
    ) || 0;
  return {
    scrollAtIndex,
    initNoOfItemsViewed,
    noOfItemsViewed: scrollAtIndex + initNoOfItemsViewed
  };
};

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

export const isOverflowing = (node = document.documentElement, root) => {
  let bool;
  if (root) {
    bool =
      (node.clientHeight || node.style.height || node.offsetHeight) +
        node.offsetTop >
      (root.clientHeight || root.style.height || root.offsetHeight);
    // console.log(node.clientHeight, node.offsetTop, root.clientHeight);
  } else {
    const flow = node.style.overflow;
    node.style.overflow = "hidden";
    bool = node ? node.clientHeight < node.scrollHeight : false;
    node.style.overflow = flow;
  }
  return bool;
};
export const scheduleTask = () => {
  let date = new Date();
  let sec = date.getSeconds();
  setTimeout(() => {
    setInterval(() => {
      // do something
    }, 60 * 1000);
  }, (60 - sec) * 1000);
};
