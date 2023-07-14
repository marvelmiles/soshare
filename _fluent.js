import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
const filename = path.resolve(
  process.cwd(),
  "client/src/components",
  "video.mp4"
);
console.log(filename);
//   "https://storage.googleapis.com/mern-social-1842b.appspot.com/shorts%2F1688667823589-new_york_taxi_cabs_street_traffic_438%20-%20Copy%20-%20Copy.mp4";
//   "https://storage.googleapis.com/mern-social-1842b.appspot.com/shorts%2F1688659783039-getvideo.page-8kf9jGaLEHwQSQX-.mp4";

(() => {
  try {
    // fs.accessSync(filename);
    const output = path.resolve(
      process.cwd(),
      "client/src/components",
      "resized.mp4"
    );
    console.log(output);
    // return console.log(output);
    const targetWidth = 640;
    const targetHeight = 480;
    ffmpeg(filename)
      .output(output)
      .videoFilter(`scale=w=320:h=(80/100)*488,setsar=1`)
      .videoCodec("libx264")
      .on("error", function(err) {
        console.log("An error occurred: " + err.message);
      })
      .on("progress", function(progress) {
        console.log("... frames: " + progress.frames);
      })
      .on("end", function() {
        console.log("Finished processing");
      })
      .run();
  } catch (err) {
    console.log("file done exist", err.message);
  }
})();
