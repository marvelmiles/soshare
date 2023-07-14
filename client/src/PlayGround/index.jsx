import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import MainView from "views/MainView";
import { setAspectRatio } from "utils";
import mp4 from "./video.mp4";

const PlayGround = props => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      return;
      return setAspectRatio(videoRef.current);
      const container = containerRef.current;
      const videoPlayer = videoRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const containerAspect = containerWidth / containerHeight;
      const videoAspect = videoPlayer.videoWidth / videoPlayer.videoHeight || 0;

      console.log(containerAspect, videoAspect);
      if (!videoAspect) {
        setTimeout(handleResize, 0);
      } else if (containerAspect > videoAspect) {
        // Container is wider than the video
        videoPlayer.style.width = "100%";
        videoPlayer.style.height = "auto";
      } else {
        console.log("taller");
        // Container is taller than the video
        videoPlayer.style.width = "auto";
        videoPlayer.style.height = "100%";
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <MainView sideView="">
      <div
        // style={{
        //   border: "1px solid red",
        //   height: "calc(100vh - 69px)",
        //   width: "100%",
        //   position: "relative",
        //   overflow: "hidden"
        //   //   paddingBottom: "56.25%"
        // }}
        className="video-container"
        ref={containerRef}
      >
        <div></div>
        <marquee>song play</marquee>
        <div className="video-wrapper">
          <video
            className="video-player"
            //   style={{
            //     border: "5px solid green",
            //     position: "absolute",
            //     top: "50%",
            //     left: "50%",
            //     transform: "translate(-50%, -50%)",
            //     width: "auto",
            //     height: "auto",
            //     maxHeight: "100%",
            //     maxWidth: "100%"
            //   }}
            ref={videoRef}
            src={mp4}
            controls
          ></video>
        </div>
        <div></div>
      </div>
    </MainView>
  );
};

PlayGround.propTypes = {};

export default PlayGround;
