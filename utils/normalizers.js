/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray(array, modify = true) {
  !modify && (array = array.slice());
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

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

export const mapToObject = (arr = []) => {
  const map = {};
  for (let i = 0; i < arr.length; i++) {
    const key =
      arr[i].id || arr[i]._id || typeof arr[i] === "string"
        ? arr[i]
        : JSON.stringify(arr[i]);
    map[key] = i;
  }
  return map;
};
