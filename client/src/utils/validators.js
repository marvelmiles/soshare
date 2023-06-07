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

// (() => {
//   const map = {
//     lesser: 0,
//     even: 0,
//     higher: 0
//   };
//   let _reg = {};
//   const populate = () => {
//     data.forEach((doc, i) => {
//       _reg[doc.id] = i;
//       if (doc.threads)
//         doc.threads.forEach((doc, i) => {
//           _reg[doc.id] = i;
//         });
//     });
//   };
//   populate();

//   const document = {
//     id: "4=24",
//     rootThread: "3=24",
//     document: { id: "3=24", rootThread: "2=24" }
//   };
//   const docId = document.id || document;
//   const bench = () => {
//     let start = performance.now();
//     const registeredIds = _reg;
//     const rootComment = data[registeredIds[document.rootThread]];
//     const dIndex = registeredIds[docId];
//     rootComment.threads[dIndex] = document.document;
//     if (rootComment.threads.length < 10) {
//       rootComment.threads
//         .slice(dIndex + 1)
//         .forEach(({ id }) => delete _reg[id]);
//       rootComment.threads = rootComment.threads.slice(0, dIndex + 1);
//       _reg[docId] = rootComment.threads.length;
//       rootComment.threads.push(document);
//     }
//     let end = performance.now();
//     let ctime = end - start;

//     start = performance.now();
//     data.forEach(doc => {
//       if (doc.id === document.rootThread) {
//         doc.threads.push(document);
//       } else if (doc.threads) {
//         doc.threads.forEach(_d => {
//           if (_d.id === document.rootThread) {
//             doc.threads.push(document);
//           }
//         });
//       }
//     });
//     end = performance.now();
//     let ftime = end - start;

//     map[ctime < ftime ? "lesser" : ctime === ftime ? "even" : "higher"]++;
//   };

//   for (let i = 0; i < 10000; i++) {
//     bench();
//   }
//   console.log(map);
// })();

// (() => {
//   const t = [];

//   for (let i = 0; i < 50; i++) {
//     const doc = {
//       threads: [
//         {
//           id: "2",
//           rootThread: "1"
//         },
//         {
//           id: "3",
//           rootThread: "2"
//         },
//         {
//           id: "4",
//           rootThread: "3"
//         },
//         {
//           id: "5",
//           rootThread: "4"
//         },
//         {
//           id: "2",
//           rootThread: "1"
//         },
//         {
//           id: "3",
//           rootThread: "2"
//         },
//         {
//           id: "4",
//           rootThread: "3"
//         },
//         {
//           id: "5",
//           rootThread: "4"
//         },
//         {
//           id: "2",
//           rootThread: "1"
//         },
//         {
//           id: "3",
//           rootThread: "2"
//         },
//         {
//           id: "4",
//           rootThread: "3"
//         },
//         {
//           id: "5",
//           rootThread: "4"
//         }
//       ],
//       id: "1"
//     };
//     doc.id = i;
//     if (doc.threads) {
//       doc.threads = doc.threads.map((_d, j) => {
//         _d.id = j + "=" + i;
//         _d.rootThread = j === 0 ? i : j - 1 + "=" + i;
//         return _d;
//       });
//     }
//     t.push({ ...doc });
//   }

//   console.log(t);
// })();

// [
//   {
//     user: {
//       id: "6436e0e74bdec4961bc0680b"
//     },
//     document: {
//       user: {
//         id: "6436e0e74bdec4961bc0680b"
//       },

//       id: "647daeca7e8d1629bddae753"
//     },
//     docType: "post",
//     threads: [
//       {
//         user: {
//           id: "6436e0e74bdec4961bc0680b"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "6436e0e74bdec4961bc0680b"
//           },
//           document: {
//             user: {
//               id: "6436e0e74bdec4961bc0680b",
//               blacklistCount: 0
//             },
//             id: "647daeca7e8d1629bddae753"
//           },
//           docType: "post",
//           threads: [],

//           id: "647f28eed1dc0763e297439a"
//         },
//         docType: "comment",
//         threads: [],

//         id: "647f4784d1dc0763e2979033"
//       },
//       {
//         user: {
//           id: "6436e0e74bdec4961bc0680b"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "6436e0e74bdec4961bc0680b"
//           },
//           rootThread: "647f28eed1dc0763e297439a",
//           rootType: "comment",
//           document: {
//             user: {
//               id: "6436e0e74bdec4961bc0680b"
//             },
//             document: "647daeca7e8d1629bddae753",
//             docType: "post",
//             threads: [],

//             id: "647f28eed1dc0763e297439a"
//           },
//           docType: "comment",
//           threads: [],

//           id: "647f4784d1dc0763e2979033"
//         },
//         docType: "comment",
//         threads: [],

//         id: "647f478bd1dc0763e297903c"
//       },
//       {
//         user: {
//           id: "63dfdf516d4ef0602b00790d"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "6436e0e74bdec4961bc0680b"
//           },
//           rootThread: "647f28eed1dc0763e297439a",
//           rootType: "comment",
//           document: {
//             user: {
//               id: "6436e0e74bdec4961bc0680b"
//             },
//             rootThread: "647f28eed1dc0763e297439a",
//             rootType: "comment",
//             document: "647f28eed1dc0763e297439a",
//             docType: "comment",
//             threads: [],

//             createdAt: "2023-06-06T14:49:40.481Z",
//             updatedAt: "2023-06-06T14:50:04.076Z",
//             id: "647f4784d1dc0763e2979033"
//           },
//           docType: "comment",
//           threads: [],

//           createdAt: "2023-06-06T14:49:47.498Z",
//           updatedAt: "2023-06-06T18:03:37.324Z",
//           id: "647f478bd1dc0763e297903c"
//         },
//         docType: "comment",
//         threads: [],
//         createdAt: "2023-06-06T18:03:37.389Z",
//         updatedAt: "2023-06-06T18:03:45.649Z",
//         id: "647f74f9f8ec9d81c8c3df2b"
//       },
//       {
//         user: {
//           id: "63dfdf516d4ef0602b00790d"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "63dfdf516d4ef0602b00790d"
//           },
//           rootThread: "647f28eed1dc0763e297439a",
//           rootType: "comment",
//           document: {
//             user: {
//               id: "6436e0e74bdec4961bc0680b"
//             },
//             rootThread: "647f28eed1dc0763e297439a",
//             rootType: "comment",
//             document: "647f4784d1dc0763e2979033",
//             docType: "comment",
//             threads: [],

//             createdAt: "2023-06-06T14:49:47.498Z",
//             updatedAt: "2023-06-06T18:03:37.324Z",
//             id: "647f478bd1dc0763e297903c"
//           },
//           docType: "comment",
//           threads: [],
//           createdAt: "2023-06-06T18:03:37.389Z",
//           updatedAt: "2023-06-06T18:03:45.649Z",
//           id: "647f74f9f8ec9d81c8c3df2b"
//         },
//         docType: "comment",
//         threads: [],

//         createdAt: "2023-06-06T18:03:45.655Z",
//         updatedAt: "2023-06-06T18:04:49.041Z",
//         id: "647f7501f8ec9d81c8c3df34"
//       },
//       {
//         user: {
//           id: "6436e0e74bdec4961bc0680b"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "63dfdf516d4ef0602b00790d"
//           },
//           rootThread: "647f28eed1dc0763e297439a",
//           rootType: "comment",
//           document: {
//             user: {
//               id: "63dfdf516d4ef0602b00790d"
//             },
//             rootThread: "647f28eed1dc0763e297439a",
//             rootType: "comment",
//             document: "647f478bd1dc0763e297903c",
//             docType: "comment",
//             threads: [],

//             createdAt: "2023-06-06T18:03:37.389Z",
//             updatedAt: "2023-06-06T18:03:45.649Z",
//             id: "647f74f9f8ec9d81c8c3df2b"
//           },
//           docType: "comment",
//           threads: [],
//           createdAt: "2023-06-06T18:03:45.655Z",
//           updatedAt: "2023-06-06T18:04:49.041Z",
//           id: "647f7501f8ec9d81c8c3df34"
//         },
//         docType: "comment",
//         threads: [],

//         createdAt: "2023-06-06T18:04:49.051Z",
//         updatedAt: "2023-06-06T18:04:56.159Z",
//         id: "647f7541f8ec9d81c8c3e046"
//       },
//       {
//         user: {
//           id: "6436e0e74bdec4961bc0680b"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "6436e0e74bdec4961bc0680b"
//           },
//           rootThread: "647f28eed1dc0763e297439a",
//           rootType: "comment",
//           document: {
//             user: {
//               id: "63dfdf516d4ef0602b00790d"
//             },
//             rootThread: "647f28eed1dc0763e297439a",
//             rootType: "comment",
//             document: "647f74f9f8ec9d81c8c3df2b",
//             docType: "comment",
//             threads: [],
//             createdAt: "2023-06-06T18:03:45.655Z",
//             updatedAt: "2023-06-06T18:04:49.041Z",
//             id: "647f7501f8ec9d81c8c3df34"
//           },
//           docType: "comment",
//           threads: [],

//           createdAt: "2023-06-06T18:04:49.051Z",
//           updatedAt: "2023-06-06T18:04:56.159Z",
//           id: "647f7541f8ec9d81c8c3e046"
//         },
//         docType: "comment",
//         threads: [],
//         createdAt: "2023-06-06T18:04:56.166Z",
//         updatedAt: "2023-06-06T18:05:04.372Z",
//         id: "647f7548f8ec9d81c8c3e04f"
//       },
//       {
//         user: {
//           id: "6436e0e74bdec4961bc0680b"
//         },
//         rootThread: "647f28eed1dc0763e297439a",
//         rootType: "comment",
//         document: {
//           user: {
//             id: "6436e0e74bdec4961bc0680b"
//           },
//           rootThread: "647f28eed1dc0763e297439a",
//           rootType: "comment",
//           document: {
//             user: {
//               id: "6436e0e74bdec4961bc0680b"
//             },
//             rootThread: "647f28eed1dc0763e297439a",
//             rootType: "comment",
//             document: "647f7501f8ec9d81c8c3df34",
//             docType: "comment",
//             threads: [],

//             id: "647f7541f8ec9d81c8c3e046"
//           },
//           docType: "comment",
//           threads: [],
//           id: "647f7548f8ec9d81c8c3e04f"
//         },
//         docType: "comment",
//         threads: [],
//         id: "647f7550f8ec9d81c8c3e058"
//       }
//     ],

//     id: "647f28eed1dc0763e297439a"
//   }
// ]
