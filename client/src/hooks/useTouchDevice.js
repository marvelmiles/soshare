import { useState, useEffect } from "react";

export const isTouchDevice = () =>
  (navigator.maxTouchPoints || navigator.msMaxTouchPoints) > 0 ||
  (window.matchMedia
    ? window.matchMedia("(hover: none)").matches
    : "ontouchstart" in window);

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
