import { useEffect, useState, useCallback } from "react";
const useViewIntersection = (targetRef, options) => {
  const [isVisibile, setIsVisible] = useState({});
  const callbackFunction = entries => {
    setIsVisible(entries[0]);
  };
  useEffect(() => {
    if (targetRef) {
      const observer = new IntersectionObserver(callbackFunction, {
        root: null,
        rootMargin: "0px",
        threshold: 0.3,
        ...options
      });
      const currentTarget = targetRef.nodeName ? targetRef : targetRef.current;
      observer.observe(currentTarget);
      return () => {
        currentTarget && observer.unobserve(currentTarget);
      };
    }
  }, [targetRef, options]);
  isVisibile.resetState = useCallback(() => setIsVisible({}), []);
  return targetRef
    ? isVisibile
    : {
        resetState: isVisibile.resetState
      };
};
export default useViewIntersection;
