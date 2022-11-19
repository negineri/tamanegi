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
      cv.threshold(gray, gray, 200, 255, cv.THRESH_BINARY);

      cv.imshow(canvas, src);
      // OpenCV.jsはemscriptenでできていて、C++の世界のオブジェクトは自動的に破棄されないため、データ構造を使ったら自分で破棄する必要がある
      src.delete();
      gray.delete();

      requestAnimationFrame(tick);
    };
    tick();
  };
};

setup();
