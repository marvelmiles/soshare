import { useEffect, useState } from "react";

const useViewIntersection = (targetRef, options) => {
  const [entry, setEntry] = useState({
    isIntersecting: false
  });

  useEffect(() => {
    const currentTarget = targetRef?.current;

    let observer;

    if (currentTarget) {
      const root = options?.root ? options.root.current || options.root : null;

      const callbackFunction = entries => {
        const entry = entries[0];
        setEntry({
          isIntersecting: entry.isIntersecting
        });
      };

      observer = new IntersectionObserver(callbackFunction, {
        rootMargin: "0px",
        threshold: 0.1,
        ...options,
        root
      });

      observer.observe(currentTarget);
    }

    return () => {
      if (observer) {
        observer.unobserve(currentTarget);
        observer.disconnect();
      }
    };
  }, [targetRef, options]);
  return entry;
};

export default useViewIntersection;
