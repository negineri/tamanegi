// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import cv from "@techstark/opencv-js";
import { loadDataFile } from "src/cvDataFile";
import haarcascade_frontalface_default from "assets/haarcascade_frontalface_default.xml";
import haarcascade_eye from "assets/haarcascade_eye.xml";

const setup = async () => {
  const devices = (await navigator.mediaDevices.enumerateDevices())
    .filter((device) => device.kind === "videoinput")
    .map((device) => {
      return {
        text: device.label,
        value: device.deviceId,
      };
    });

  await loadDataFile(
    "haarcascade_frontalface_default.xml",
    haarcascade_frontalface_default
  );
  await loadDataFile("haarcascade_eye.xml", haarcascade_eye);

  // const video = document.getElementById("camera") as HTMLVideoElement;
  const video = document.createElement("video") as HTMLVideoElement;
  video.playsInline = true;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: devices[0]["value"] },
    audio: false,
  });
  video.srcObject = stream;
  // video.play();

  video.onloadedmetadata = () => {
    video.play();
    // 後程OpenCVで使用するので、表示しないcanvasを用意してそこにvideoの内容を書き写しておく
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d");

    // 表示用のcanvasも用意
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    canvas.width = buffer.width = video.videoWidth;
    canvas.height = buffer.height = video.videoHeight;
    const faceCascade = new cv.CascadeClassifier(
      "haarcascade_frontalface_default.xml"
    );
    const eyeCascade = new cv.CascadeClassifier("haarcascade_eye.xml");

    // この後毎フレームごとに呼ばれる関数
    const tick = () => {
      bufferCtx.drawImage(video, 0, 0);
      const src = cv.imread(buffer);
      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      let faces = new cv.RectVector();
      let eyes = new cv.RectVector();
      let msize = new cv.Size(0, 0);
      faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
      for (let i = 0; i < faces.size(); ++i) {
        let roiGray = gray.roi(faces.get(i));
        let roiSrc = src.roi(faces.get(i));
        let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
        let point2 = new cv.Point(
          faces.get(i).x + faces.get(i).width,
          faces.get(i).y + faces.get(i).height
        );
        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
        eyeCascade.detectMultiScale(roiGray, eyes);
        for (let j = 0; j < eyes.size(); ++j) {
          let point1 = new cv.Point(eyes.get(j).x, eyes.get(j).y);
          let point2 = new cv.Point(
            eyes.get(j).x + eyes.get(j).width,
            eyes.get(j).y + eyes.get(j).height
          );
          cv.rectangle(roiSrc, point1, point2, [0, 0, 255, 255]);
        }
        roiGray.delete();
        roiSrc.delete();
      }
      cv.imshow(canvas, src);
      // OpenCV.jsはemscriptenでできていて、C++の世界のオブジェクトは自動的に破棄されないため、データ構造を使ったら自分で破棄する必要がある
      src.delete();
      gray.delete();
      faces.delete();
      eyes.delete();

      requestAnimationFrame(tick);
    };
    tick();
  };
};

setup();
