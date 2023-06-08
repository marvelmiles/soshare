export default {
  blacklistedPosts: {},
  blacklistedUsers: {},
  usersSet: {},
  composeDoc: {},
  filterDocsByUserSet: (infiniteScrollUtils, usersSet, subPath, stateCtx) => {
    const { data, setData } = infiniteScrollUtils;
    let update;
    for (let i = 0; i < data.data.length; i++) {
      const doc = data.data[i];

      const deleteFromReg = doc => {
        delete stateCtx.registeredIds[doc.id];

        if (doc[subPath])
          for (const { id } of doc[subPath]) {
            delete stateCtx.registeredIds[id];
          }
      };

      if (usersSet[doc.user.id]) {
        update = true;
        const doc = data.data.splice(i, 1);
        stateCtx?.registeredIds && deleteFromReg(doc);
        continue;
      }

      if (doc[subPath])
        for (let i = 0; i < doc[subPath].length; i++) {
          if (usersSet[doc[subPath][i].user.id]) {
            update = true;
            const array = doc[subPath].splice(i);
            stateCtx?.registeredIds && array.forEach(deleteFromReg);
            break;
          }
        }
    }
    update &&
      setData({
        ...data
      });
  }
};
