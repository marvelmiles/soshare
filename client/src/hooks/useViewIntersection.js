import { useEffect, useState, useCallback, useRef } from "react";
import { isDOMElement } from "../utils/validators";

const useViewIntersection = (targetRef, options, verify) => {
  const [entry, setEntry] = useState({
    isIntersecting: false,
    key: false
  });
  const stateRef = useRef({
    nodeKey: options?.nodeKey
  });

  const callbackFunction = entries => {
    const entry = entries[0] || {
      target: {
        dataset: {}
      }
    };
    let key = stateRef.current.nodeKey
      ? entry.target.dataset[stateRef.current.nodeKey] ||
        entry.target.getAttribute(stateRef.current.nodeKey) ||
        ""
      : entry.target.id || entry.target.dataset.id || "";
    if (entry.isIntersecting) {
      if (!key) {
        key = Date.now();
        entry.target.dataset.id = key;
      }
    } else key = "";
    entry.intersectionKey = key;

    setEntry(entry);
  };

  useEffect(() => {
    let observer,
      currentTarget = targetRef
        ? isDOMElement(targetRef)
          ? targetRef
          : targetRef.current
        : undefined;

    if (currentTarget) {
      observer = new IntersectionObserver(callbackFunction, {
        rootMargin: "0px",
        threshold: 0.8,
        ...options,
        root: options?.root
          ? options.root.current
            ? options.root.current || null
            : isDOMElement(options.root)
            ? options.root
            : null
          : null
      });

      stateRef.current.observer = observer;
      stateRef.current.target = currentTarget;

      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
        observer.disconnect();
      }
    };
  }, [targetRef, options, verify]);

  return entry;
};

export default useViewIntersection;
  