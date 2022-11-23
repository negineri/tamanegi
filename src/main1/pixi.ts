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
import cv, { EmscriptenEmbindInstance } from "@techstark/opencv-js";
import { loadDataFile } from "src/cvDataFile";
import haarcascade_frontalface_default from "assets/haarcascade_frontalface_default.xml";
import haarcascade_eye from "assets/haarcascade_eye.xml";
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
// app.stage.addChild(bgVideoSprite);

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
let flags = { tracking: true, detectCount: 0 };
let centralText: PIXI.Container;

type DataStore = {
  text: PIXI.Container;
  texts: PIXI.Container[];
  bgVideo: PIXI.Container;
};
const store: DataStore = { text: null, texts: [], bgVideo: bgVideoSprite };

const setupCamera = async (
  ticker: PIXI.Ticker,
  flags: {
    tracking: boolean;
    detectCount: number;
  }
) => {
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
  const faceCascade = new cv.CascadeClassifier(
    "haarcascade_frontalface_default.xml"
  );
  const eyeCascade = new cv.CascadeClassifier("haarcascade_eye.xml");

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
    // app.stage.addChild(cameraSprite);
    ticker.add(() => {
      if (!flags.tracking) {
        return;
      }
      flags.detectCount = 0;
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
          flags.detectCount++;
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
      cameraTexture.update();
    });
  };
};

const setup = async () => {
  setupCamera(app.ticker, flags);

  const sentencesData: SentencesJSON = sentencesJsonFile;
  sentences = loadSentences(sentencesData);
  nextMs = new Date().getTime() + intervalMs;

  GSAP.ticker.add(() => {
    draw();
    app.ticker.update();
  });
};

function draw() {
  // console.log(flags.detectCount);
  const scale = app.view.width / stageWidth;
  app.stage.scale.set(scale, scale);
  app.stage.position.y = (app.view.height - stageHeight * scale) / 2;
  if (scene == 0) {
    scene = 1;
    console.log("scene 0");
    // スタンバイ初期化
    if (store.text != null) {
      app.stage.removeChild(store.text);
      store.text = null;
    }
    const text = sentences[Math.floor(Math.random() * sentences.length)].text();
    text.x = stageWidth / 2;
    text.y = stageHeight / 2;
    text.pivot.x = text.width / 2;
    text.pivot.y = text.height / 2;
    text.width = text.width * 1.5;
    text.height = text.height * 1.5;
    text.alpha = 1;
    app.stage.addChild(text);
    store.text = text;
    flags.tracking = true;
  } else if (scene == 1) {
    // スタンバイ
    console.log(flags.detectCount);
    if (flags.detectCount >= 2) {
      scene = 2;
      flags.tracking = false;
      const tl = GSAP.timeline();
      tl.to(store.text, {
        ease: "power2.out",
        alpha: 0,
        duration: 4.0,
        onComplete: () => {
          scene = 3;
        },
      });
    }
  } else if (scene == 2) {
    // 遷移中
  } else if (scene == 3) {
    // ドアホンスタンバイ初期化
    scene = 4;
    app.stage.addChild(store.bgVideo);
  } else if (scene == 4) {
    // ドアホンスタンバイ
    let keyFlag = 0;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        if (gp.buttons[0].pressed) {
          keyFlag = 1;
        }
      }
    }
    if (keyFlag == 1) {
      for (let index = 0; index < 30; index++) {
        const text =
          sentences[Math.floor(Math.random() * sentences.length)].text();
        text.x = Math.random() * stageWidth;
        text.y = Math.random() * stageHeight;
        text.pivot.x = text.width / 2;
        text.pivot.y = text.height / 2;
        text.alpha = 0;
        app.stage.addChild(text);
        const tl = GSAP.timeline();
        tl.to(text, { alpha: 1, duration: 0, delay: Math.random() * 1 }).to(
          text,
          {
            ease: "power4.out",
            alpha: 0,
            duration: 3.0,
          }
        );
        texts.push(text);
      }
      window.setTimeout(() => (scene = 5), 5000);
    }
  } else if (scene == 5) {
    scene = 0;
    app.stage.removeChild(store.bgVideo);
    for (let index = 0; index < texts.length; index++) {
      app.stage.removeChild(texts[index]);
      texts[index] = null;
    }
    texts.splice(0);
  }
}

PIXI.Loader.shared.onComplete.once(() => {
  setup();
});
