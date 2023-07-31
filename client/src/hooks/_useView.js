import { useEffect, useState, useRef } from "react";
import {
  isDOMElement,
  isAtScrollBottom,
  isOverflowing
} from "utils/validators";
import { modifyElementDataset } from "utils";

const useViewIntersection = (targetRef, options) => {
  const [entry, setEntry] = useState({
    isIntersecting: false,
    intersectionKey: ""
  });
  const stateRef = useRef({
    nodeKey: options?.nodeKey,
    retryCount: 0
  });

  useEffect(() => {
    let observer, taskId;

    const currentTarget =
      targetRef && (isDOMElement(targetRef) ? targetRef : targetRef.current);

    const root = options?.root
      ? options.root.current
        ? options.root.current || null
        : isDOMElement(options.root)
        ? options.root
        : null
      : null;

    const callbackFunction = entries => {
      const entry = entries[0];
      entry.intersectionKey = entry.isIntersecting
        ? entry.target.dataset.id || Date.now()
        : "";

      console.log("is inter s", entry.isIntersecting);
      setEntry(entry);
    };

    const clearState = () => {
      stateRef.current.retryCount = 0;
      clearInterval(taskId);
    };

    setEntry(prev => ({ ...prev, isIntersecting: false }));

    if (currentTarget) {
      // modifyElementDataset(currentTarget);

      const observer = new IntersectionObserver(callbackFunction, {
        rootMargin: "0px",
        threshold: 0.8,
        ...options,
        root
      });

      stateRef.current.taskId = taskId;
      observer.observe(currentTarget);
    }

    // observed node in visible screen area after prev intersections dont
    // invoke cb immediately. using interval provides a reliable logic

    // taskId = setInterval(() => {
    //   const limitReached = stateRef.current.retryCount === 2;
    //   // console.log(stateRef.current.retryCount, "in count");
    //   if (limitReached || true) {
    //     clearState();
    //     return;
    //   }
    //   stateRef.current.retryCount++;

    //   setEntry(prev => {
    //     const b = isOverflowing(root || undefined);
    //     // options?.verify &&
    //     //   console.log(
    //     //     limitReached,
    //     //     b,
    //     //     prev.isIntersecting,
    //     //     stateRef.current.retryCount,
    //     //     " entry "
    //     //   );
    //     if (b) {
    //       // options?.verify && console.log("overflowing");
    //       const bool =
    //         prev.isIntersecting ||
    //         isAtScrollBottom(root || undefined, options?.verify);
    //       // options?.verify && console.log(bool, prev.isIntersecting, " in int");
    //       prev = {
    //         ...prev,
    //         isIntersecting: bool,
    //         intersectionKey:
    //           bool && currentTarget
    //             ? currentTarget.dataset.id || Date.now()
    //             : ""
    //       };
    //     }
    //     return prev;
    //   });
    // }, 100);

    return () => {
      if (observer) {
        observer.unobserve(currentTarget);
        observer.disconnect();
      }
      clearState();
    };
  }, [targetRef, options]);

  return entry;
};

export default useViewIntersection;
