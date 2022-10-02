// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";
import GSAP from "gsap";
import { keyFlag } from "src/keyevent";
import bitmapFnt from "assets/biz-udpmincho64/biz-udpmincho64.fnt";
import bitmapFontImage0 from "assets/biz-udpmincho64/biz-udpmincho64_0.png";
import bitmapFontImage1 from "assets/biz-udpmincho64/biz-udpmincho64_1.png";
import bitmapFontImage2 from "assets/biz-udpmincho64/biz-udpmincho64_2.png";
import bitmapFontImage3 from "assets/biz-udpmincho64/biz-udpmincho64_3.png";
import bitmapFontImage4 from "assets/biz-udpmincho64/biz-udpmincho64_4.png";
import bitmapFontImage5 from "assets/biz-udpmincho64/biz-udpmincho64_5.png";
import bitmapFontImage6 from "assets/biz-udpmincho64/biz-udpmincho64_6.png";
import sentencesJsonFile from "assets/sentences.json";
import { Assets } from "@pixi/assets";

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

interface SentenceJSON {
  sentence: string[];
}
interface SentencesJSON {
  sentences: SentenceJSON[];
}

const fntXmlDoc = new DOMParser().parseFromString(bitmapFnt, "application/xml");
console.log(fntXmlDoc);
const bitmapFontTexture0 = PIXI.Texture.from(bitmapFontImage0);
const bitmapFontTexture1 = PIXI.Texture.from(bitmapFontImage1);
const bitmapFontTexture2 = PIXI.Texture.from(bitmapFontImage2);
const bitmapFontTexture3 = PIXI.Texture.from(bitmapFontImage3);
const bitmapFontTexture4 = PIXI.Texture.from(bitmapFontImage4);
const bitmapFontTexture5 = PIXI.Texture.from(bitmapFontImage5);
const bitmapFontTexture6 = PIXI.Texture.from(bitmapFontImage6);
PIXI.BitmapFont.install(fntXmlDoc, [
  bitmapFontTexture0,
  bitmapFontTexture1,
  bitmapFontTexture2,
  bitmapFontTexture3,
  bitmapFontTexture4,
  bitmapFontTexture5,
  bitmapFontTexture6,
]);

const load = async () => {
  const sentencesData: SentencesJSON = sentencesJsonFile;
  // const bitmapFntXml = await Assets.load(bitmapFnt);
  // const bitmapFntXml = await window.api.loadFnt();

  // console.log(bitmapFntXml);
};

load();

// Now, we use 'tick' from gsap
GSAP.ticker.add(() => {
  draw();
  app.ticker.update();
});

function draw() {
  count += 5.0;
  const scale = app.view.width / stageWidth;
  app.stage.scale.set(scale, scale);
  app.stage.position.y = (app.view.height - stageHeight * scale) / 2;
  // console.log(app.stage.width, app.stage.height);
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
