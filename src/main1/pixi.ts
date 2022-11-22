// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";
import GSAP from "gsap";
import { keyFlag } from "src/keyevent";
import sentencesJsonFile from "assets/sentences.json";
import { SentencesJSON, loadSentences, Sentence } from "./sentences";
import { WebfontLoaderPlugin } from "pixi-webfont-loader";
import bizudpmincho from "assets/BIZUDPMincho-Regular.ttf";
import bgVideo from "assets/video.mp4";
import cv from "@techstark/opencv-js";
// import bgVideo from "assets/試作1.mov";

PIXI.Loader.registerPlugin(WebfontLoaderPlugin);

PIXI.Loader.shared.add({ name: "BIZ UDPMincho", url: bizudpmincho });
PIXI.Loader.shared.load();

const stageWidth = 1920;
const stageHeight = 1080;

const app = new PIXI.Application({
  backgroundColor: 0xffffff,
  resizeTo: window,
});

document.body.appendChild(app.view);

const bgVideoTexture = PIXI.Texture.from(bgVideo, {});
const bgVideoResource = bgVideoTexture.baseTexture
  .resource as PIXI.VideoResource;
bgVideoResource.source.loop = true;
const bgVideoSprite = new PIXI.Sprite(bgVideoTexture);
app.stage.addChild(bgVideoSprite);

// We stop Pixi ticker using stop() function because autoStart = false does NOT stop the shared ticker:
// doc: http://pixijs.download/release/docs/PIXI.Application.html
app.ticker.stop();

// Global
let drawing = false;
let graphic: PIXI.Graphics = null;
let count = 0;

let xIni = 0;
let yIni = 0;
let sentences: Sentence[];
let nextMs = 0;
const intervalMs = 400;
const texts: PIXI.Container[] = [];
let scene = 0;

const setup = async () => {
  const devices = (await navigator.mediaDevices.enumerateDevices())
    .filter((device) => device.kind === "videoinput")
    .map((device) => {
      return {
        text: device.label,
        value: device.deviceId,
      };
    });

  // const video = document.getElementById("camera") as HTMLVideoElement;

  const video = document.createElement("video") as HTMLVideoElement;
  video.playsInline = true;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: devices[0]["value"] },
    audio: false,
  });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    video.play();
    // 後程OpenCVで使用するので、表示しないcanvasを用意してそこにvideoの内容を書き写しておく
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });

    // 表示用のcanvasも用意
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const canvasCtx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = buffer.width = video.videoWidth;
    canvas.height = buffer.height = video.videoHeight;
    const cameraTexture = PIXI.Texture.from(canvas);
    const cameraSprite = new PIXI.Sprite(cameraTexture);
    const scale = stageWidth / canvas.width;
    cameraSprite.scale.set(scale, scale);
    app.stage.addChild(cameraSprite);
    const tick = () => {
      bufferCtx.drawImage(video, 0, 0);
      /*
      const src = cv.imread(buffer);
      let gray = new cv.Mat();
      let dst = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.threshold(gray, gray, 200, 255, cv.THRESH_BINARY);
      cv.cvtColor(gray, dst, cv.COLOR_GRAY2RGBA);
      /*
      let tgray = gray.data;
      for (let i = 0; i < gray.data.length; i++) {
        if (tgray[i] === 255) {
          dst.data[i * 4 + 3] = 0;
        }
      }

      cv.imshow(canvas, dst);
      let imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
      */
      let imageData = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);
      for (var i = 0; i < imageData.data.length / 4; i++) {
        const gray =
          (imageData.data[i * 4] +
            imageData.data[i * 4 + 1] +
            imageData.data[i * 4 + 2]) /
          3;
        if (gray > 200) {
          imageData.data[i * 4] = 255;
          imageData.data[i * 4 + 1] = 255;
          imageData.data[i * 4 + 2] = 255;
          imageData.data[i * 4 + 3] = 0;
        } else {
          imageData.data[i * 4] = 0;
          imageData.data[i * 4 + 1] = 0;
          imageData.data[i * 4 + 2] = 0;
        }
      }
      canvasCtx.putImageData(imageData, 0, 0);
      // OpenCV.jsはemscriptenでできていて、C++の世界のオブジェクトは自動的に破棄されないため、データ構造を使ったら自分で破棄する必要がある
      /*
      src.delete();
      gray.delete();
      dst.delete();
      */
      cameraTexture.update();

      requestAnimationFrame(tick);
    };
    tick();
  };
  const sentencesData: SentencesJSON = sentencesJsonFile;
  sentences = loadSentences(sentencesData);
  nextMs = new Date().getTime() + intervalMs;
  // Now, we use 'tick' from gsap
  GSAP.ticker.add(() => {
    draw();
    app.ticker.update();
  });

  // const bitmapFntXml = await Assets.load(bitmapFnt);
  // const bitmapFntXml = await window.api.loadFnt();

  // console.log(bitmapFntXml);
};

function draw() {
  // console.log(new Date().getTime());
  count += 5.0;
  const scale = app.view.width / stageWidth;
  app.stage.scale.set(scale, scale);
  app.stage.position.y = (app.view.height - stageHeight * scale) / 2;
  // console.log(app.stage.width, app.stage.height);
  if (scene == 0 && keyFlag == 1) {
    scene = 1;
    const text = sentences[Math.floor(Math.random() * sentences.length)].text();
    text.x = stageWidth / 2;
    text.y = stageHeight / 2;
    text.pivot.x = text.width / 2;
    text.pivot.y = text.height / 2;
    text.width = text.width * 1.5;
    text.height = text.height * 1.5;
    text.alpha = 0;
    app.stage.addChild(text);
    const tl = GSAP.timeline();
    tl.to(text, {
      ease: "power2.out",
      alpha: 255,
      duration: 6.0,
      delay: 3.0,
    }).to(text, {
      ease: "power2.out",
      alpha: 0,
      duration: 4.0,
      onComplete: () => {
        scene = 0;
        nextMs = new Date().getTime() + intervalMs;
      },
    });
    texts.push(text);
    if (texts.length > 100) app.stage.removeChild(texts.shift());
  }
  if (scene == 0 && new Date().getTime() > nextMs) {
    const text = sentences[Math.floor(Math.random() * sentences.length)].text();
    text.x = Math.random() * stageWidth;
    text.y = Math.random() * stageHeight;
    text.pivot.x = text.width / 2;
    text.pivot.y = text.height / 2;
    app.stage.addChild(text);
    GSAP.to(text, { ease: "power4.out", alpha: 0, duration: 4.0 });
    texts.push(text);
    if (texts.length > 100) app.stage.removeChild(texts.shift());
    nextMs += intervalMs;
  }
  return;
  if (!drawing && keyFlag == 0) {
    drawing = true;
    graphic = new PIXI.Graphics();
    graphic.lineStyle(
      8,
      Number(`0x${Math.floor(Math.random() * 16777215).toString(16)}`),
      1
    );
    app.stage.addChild(graphic);
    xIni = Math.random() * stageWidth;
    yIni = Math.random() * stageHeight;
  } else if (count > 50) {
    count = 0;
    drawing = false;
  } else {
    graphic.moveTo(xIni, yIni);
    graphic.lineTo(xIni + Math.cos(count) * 20, yIni + Math.sin(count) * 20);
  }
}

PIXI.Loader.shared.onComplete.once(() => {
  setup();
});
