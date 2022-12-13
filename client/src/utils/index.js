export const isTouchDevice = () =>
  window.matchMedia("(pointer: coarse)").matches ||
  window.ontouchstart !== undefined;
