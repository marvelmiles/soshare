import { useEffect, useState, useRef } from "react";
import useViewIntersection from "hooks/useViewIntersection";
import http from "api/http";
import { useContext } from "redux/store";
const useInfiniteScroll = ({
  observedNode,
  url,
  intersectionProp,
  autoFetch
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    data: []
  });
  const { setSnackBar } = useContext();
  const stateRef = useRef({
    intersection: intersectionProp
  }).current;
  const { isIntersecting } = useViewIntersection(
    observedNode,
    stateRef.intersection
  );
  useEffect(() => {
    if (
      data.paging
        ? isIntersecting && data.paging.nextCursor
        : !stateRef.initFetch && autoFetch
    ) {
      stateRef.initFetch = true;
      (async () => {
        try {
          setLoading(true);
          const _data = await http.get(
            url + `?limit=5&cursor=${data.paging?.nextCursor || ""}`,
            {
              withCredentials: true
            }
          );
          let hasData;
          setData(prev => {
            if (hasData) return prev;
            hasData = true;
            _data.data = prev.data.concat(_data.data);
            return _data;
          });
        } catch (message) {
          setSnackBar(message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [data.paging, url, stateRef, isIntersecting, autoFetch, setSnackBar]);

  return { data, loading, setData };
};

export default useInfiniteScroll;
