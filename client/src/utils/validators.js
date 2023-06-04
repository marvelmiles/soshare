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

// (() => {
//   let map = {
//     lesser: 0,
//     higher: 0,
//     even: 0
//   };

//   const bench = (withd = true) => {
//     const arr = data.slice();
//     const stateCtx = {
//       registeredIds: {},
//       cachedData: {}
//     };
//     arr.forEach(
//       (doc, index) => (stateCtx.registeredIds[doc.id] = index)
//     );
//     const docId = withd
//       ? arr[Math.floor(Math.random() * arr.length)].id
//       : "";
//     const uid = withd
//       ? ""
//       : arr[Math.floor(Math.random() * arr.length)].user.id;

//     let start = performance.now();
//     const handleDelete = (doc, index) => {
//       delete stateCtx.registeredIds[doc.id];
//       arr.splice(index, 1);

//       stateCtx.cachedData[doc.id] = {
//         index,
//         data: doc
//       };
//     };
//     let index = stateCtx.registeredIds[docId];
//     let doc = arr[index];
//     if (uid) {
//       for (const key in stateCtx.registeredIds) {
//         index = stateCtx.registeredIds[key];
//         doc = arr[index];
//         if (doc && doc.user.id === uid) handleDelete(doc, index);
//       }
//     } else handleDelete(doc, index);
//     let end = performance.now();
//     let ctime = end - start;

//     start = performance.now();
//     arr.filter((doc, index) => {
//       if (doc.id === docId || doc.user.id === uid) {
//         delete stateCtx.registeredIds[doc.id];
//         arr.splice(index, 1);

//         stateCtx.cachedData[doc.id] = {
//           index,
//           data: doc
//         };
//         return false;
//       }
//       return true;
//     });
//     end = performance.now();
//     let ftime = end - start;
//     map[
//       ctime < ftime ? "lesser" : ctime === ftime ? "even" : "higher"
//     ]++;
//   };

//   for (let i = 0; i < 5000; i++) {
//     bench();
//   }
//   console.log(map);
//   map = {
//     lesser: 0,
//     higher: 0,
//     even: 0
//   };
//   for (let i = 0; i < 5000; i++) {
//     bench(false);
//   }
//   console.log(map);
// })();

// (() => {
//   const map = {
//     lesser: 0,
//     higher: 0,
//     even: 0
//   };
//   const bench = () => {
//     const arr = data.slice();
//     const index = Math.floor(Math.random() * arr.length);
//     let start = performance.now();
//     arr.splice(index, 1);
//     let end = performance.now();
//     let ctime = end - start;

//     start = performance.now();
//     arr.filter((_, i) => i !== index);
//     end = performance.now();
//     let ftime = end - start;

//     map[ctime < ftime ? "lesser" : ctime === ftime ? "even" : "higher"]++;
//   };

//   for (let i = 0; i < 10000; i++) {
//     bench();
//   }
//   console.log(map);
// })();
