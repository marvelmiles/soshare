export const updateStatePath = (state, path, payload) => {
  const key = payload.key;
  if (key) {
    if (payload.whitelist) {
      const obj = { ...state[path][key] };
      if (Array.isArray(obj))
        for (const key of payload.value) {
          delete obj[key.id || key];
        }
      else
        for (const key in payload.value) {
          delete obj[key];
        }
      state[path][key] = obj;
    } else {
      state[path][key] = {
        ...state[path][key],
        ...payload.value
      };
    }
    state[path] = {
      ...state[path]
    };
  } else {
    if (payload.forceUpdate) delete payload.forceUpdate;
    else if (payload.socials) {
      payload.socials = {
        ...state[
          {
            previewUser: "currentUser",
            currentUser: "previewUser"
          }[path]
        ].socials,
        ...payload.socials
      };
    }

    state[path] = {
      ...state[path],
      ...payload
    };
  }
};
