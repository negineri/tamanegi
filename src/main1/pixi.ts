// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";
import GSAP from "gsap";
import { keyFlag, camNum } from "src/keyevent";
import sentencesJsonFile from "assets/sentences.json";
import { SentencesJSON, loadSentences, Sentence } from "./sentences";
import { WebfontLoaderPlugin } from "pixi-webfont-loader";
import bizudpmincho from "assets/BIZUDPMincho-Regular.ttf";
import bgVideo from "assets/video.mp4";
import cv, {
  CameraHelper,
  EmscriptenEmbindInstance,
} from "@techstark/opencv-js";
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
bgVideoSprite.visible = false;
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
let flags = { tracking: true, detect: false };
let centralText: PIXI.Container;
let pScale: number[] = [];
const cMask = new PIXI.Graphics();
cMask.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
cMask.beginFill(0x0000000, 1);
cMask.drawCircle(stageWidth / 2, stageHeight / 2, 420);
cMask.endFill();

type DataStore = {
  text: PIXI.Container;
  texts: PIXI.Container[];
  bgVideo: PIXI.Container;
  l1: PIXI.Container;
  l2: PIXI.Container;
  mask: PIXI.Graphics;
};
const store: DataStore = {
  text: null,
  texts: [],
  bgVideo: bgVideoSprite,
  l1: new PIXI.Container(),
  l2: new PIXI.Container(),
  mask: cMask,
};
app.stage.addChild(store.l1);
app.stage.addChild(store.l2);
store.l2.addChild(bgVideoSprite);
store.l2.addChild(store.mask);
store.l2.mask = store.mask;

const setupCamera = async (
  ticker: PIXI.Ticker,
  flags: {
    tracking: boolean;
    detect: boolean;
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
    video: { deviceId: devices[camNum]["value"] },
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
      bufferCtx.drawImage(video, 0, 0);
      let imageData = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);
      let nScale: number[] = [];
      let diffScore = 0;
      for (var i = 0; i < imageData.data.length / 4; i++) {
        const scale = Math.floor(
          (imageData.data[i * 4] +
            imageData.data[i * 4 + 1] +
            imageData.data[i * 4 + 2]) /
            3 /
            16
        );
        if (pScale.length === imageData.data.length / 4) {
          diffScore += (pScale[i] - scale) ** 2;
        }
        pScale[i] = scale;
      }
      console.log(diffScore + " / " + (imageData.width * imageData.height) / 4);
      if (diffScore > (imageData.width * imageData.height) / 4) {
        flags.detect = true;
      } else {
        flags.detect = false;
      }
      canvasCtx.putImageData(imageData, 0, 0);
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
    if (keyFlag == 1) {
      const grid = new PIXI.Graphics();

      // Rectangle
      const lineWidth = 10;
      for (let y = 1; y < 6; y++) {
        scene = -1;
        grid.beginFill(0x000000);
        grid.drawRect(
          0,
          (stageHeight / 6) * y - lineWidth / 2,
          stageWidth,
          lineWidth
        );
        grid.endFill();
      }
      for (let x = 1; x < 12; x++) {
        grid.beginFill(0x000000);
        grid.drawRect(
          (stageWidth / 12) * x - lineWidth / 2,
          0,
          lineWidth,
          stageHeight
        );
        grid.endFill();
      }
      app.stage.addChild(grid);
    }
    // スタンバイ初期化
    if (store.text != null) {
      // app.stage.removeChild(store.text);
      store.l2.removeChild(store.text);
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
    // app.stage.addChild(text);
    store.l2.addChild(text);
    store.text = text;
    flags.tracking = true;
  } else if (scene == 1) {
    // スタンバイ
    if (flags.detect) {
      scene = 3;
      // flags.tracking = false;
      const tl = GSAP.timeline();
      tl.to(store.text, {
        ease: "power2.out",
        alpha: 0,
        duration: 4.0,
        onComplete: () => {
          // scene = 3;
        },
      });
    }
  } else if (scene == 2) {
    // 遷移中
  } else if (scene == 3) {
    // ドアホンスタンバイ初期化
    scene = 4;
    store.bgVideo.visible = true;
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
      for (let index = 0; index < texts.length; index++) {
        // app.stage.removeChild(texts[index]);
        store.l2.removeChild(texts[index]);
        texts[index] = null;
      }
      texts.splice(0);
      for (let index = 0; index < 30; index++) {
        const text =
          sentences[Math.floor(Math.random() * sentences.length)].text();
        text.x = Math.random() * stageWidth;
        text.y = Math.random() * stageHeight;
        text.pivot.x = text.width / 2;
        text.pivot.y = text.height / 2;
        text.alpha = 0;
        // app.stage.addChild(text);
        store.l2.addChild(text);
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
        store.bgVideo.visible = false;
      }
      window.setTimeout(() => (scene = 5), 4000);
    }
  } else if (scene == 5) {
    scene = 0;
  }
}

PIXI.Loader.shared.onComplete.once(() => {
  setup();
});
