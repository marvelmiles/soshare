import { useState, useEffect } from "react";

export const isTouchDevice = () =>
  window.matchMedia("(pointer: coarse)").matches ||
  window.ontouchstart !== undefined;

const useTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(isTouchDevice());
  useEffect(() => {
    const onResize = () => setIsTouch(isTouchDevice());
    window.addEventListener("resize", onResize, false);
    return () => window.removeEventListener("reisze", onResize, false);
  }, []);
  return {
    isTouchDevice: isTouch
  };
};

export default useTouchDevice;
