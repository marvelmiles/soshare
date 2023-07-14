import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
const input = path.resolve(process.cwd(), "client/src/components", "video.mp4");
const output = path.resolve(
  process.cwd(),
  "client/src/PlayGround",
  "video.mp4"
);
console.log(input, output);
const outputWidth = 1920; // Desired output width
const outputHeight = 1080; // Desired output height

function resizingFFmpeg(video, width, height, tempFile, autoPad, padColor) {
  return new Promise((res, rej) => {
    let ff = ffmpeg()
      .input(video)
      .outputOptions(`-vf scale=${width}:${height},setsar=1`);
    autoPad ? (ff = ff.autoPad(autoPad, padColor)) : null;
    ff.output(tempFile)

      .on("progress", function(progress) {
        console.log("...Resizing frame ", progress.frames);
      })
      .on("error", function(err) {
        console.log("Problem performing ffmpeg resize");
        rej(err);
      })
      .on("end", function() {
        console.log("End resizingFFmpeg:", tempFile);
        res(tempFile);
      })
      .run();
  });
}

async function getDimentions(media) {
  return new Promise((res, rej) => {
    ffmpeg.ffprobe(media, (err, metadata) => {
      if (err) return rej(err);
      res({
        width: metadata.streams[0].width,
        height: metadata.streams[0].height
      });
    });
  });
}

function videoCropCenterFFmpeg(video, w, h, tempFile) {
  return new Promise((res, rej) => {
    ffmpeg()
      .input(video)
      .videoFilters([
        {
          filter: "crop",
          options: {
            w,
            h
          }
        }
      ])
      .output(tempFile)
      .on("progress", function(progress) {
        console.log("...Cropping frame ", progress.frames);
      })
      .on("error", function(err) {
        console.log("Problem performing ffmpeg cropping function");
        rej(err);
      })
      .on("end", function() {
        console.log("End videoCropCenterFFmpeg:", tempFile);
        res(tempFile);
      })
      .run();
  });
}

const scaleAndResizeVideo = async (video, options = {}) => {
  try {
    const { width: newWidth = "640", height: newHeight = "1024" } = options;
    const { width, height } = await getDimentions(video);
    if ((width / height).toFixed(2) > (newWidth / newHeight).toFixed(2)) {
      // y=0 case
      // landscape to potrait case
      const x = width - (newWidth / newHeight) * height;
      console.log(`New Intrim Res: ${width - x}x${height}`);
      const cropping = path.resolve(
        process.cwd(),
        "client/src/PlayGround",
        "tmpFile.mp4"
      );

      // let cropped = await videoCropCenterFFmpeg(
      //   video,
      //   width - x,
      //   height,
      //   cropping
      // );
      //  unlink temp cropping file
      // fs.unlink(cropping, err => {
      //   if (err) console.log("Erorr unlinking: ", err.message);
      //   console.log(`Temp file ${cropping} deleted Successfuly...`);
      // });

      let resized = await resizingFFmpeg(video, newWidth, newHeight, output);

      return resized;
    } else if (
      (width / height).toFixed(2) < (newWidth / newHeight).toFixed(2)
    ) {
      // x=0 case
      // potrait to landscape case
      // calculate crop or resize with padding or blur sides
      // or just return with black bars on the side
      return await resizingFFmpeg(video, newWidth, newHeight, output, true);
    } else {
      console.log("Same Aspect Ratio forward for resizing");
      return await resizingFFmpeg(video, newWidth, newHeight, output);
    }
  } catch (err) {
    console.log(err.message);
  }
};

scaleAndResizeVideo(input);
