// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";
import GSAP from "gsap";
import { keyFlag } from "src/keyevent";
import sentencesJsonFile from "assets/sentences.json";
import { SentencesJSON, loadSentences, Sentence } from "./sentences";
import { WebfontLoaderPlugin } from "pixi-webfont-loader";
import bizudpmincho from "assets/BIZUDPMincho-Regular.ttf";

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
