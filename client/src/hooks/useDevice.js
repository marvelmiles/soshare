import { useState, useEffect } from "react";

export const isTouchDevice = () =>
  (navigator.maxTouchPoints || navigator.msMaxTouchPoints) > 0 ||
  (window.matchMedia
    ? window.matchMedia("(hover: none)").matches
    : "ontouchstart" in window);

const useDevice = () => {
  const [device, setDevice] = useState({ isTouchDevice: isTouchDevice() });
  useEffect(() => {
    const onResize = e =>
      setDevice({
        isTouchDevice: isTouchDevice(),
        deviceWidth: window.innerWidth,
        deviceHeight: window.innerHeight
      });
    window.addEventListener("resize", onResize, false);
    return () => window.removeEventListener("reisze", onResize, false);
  }, []);
  return device;
};

export default useDevice;
