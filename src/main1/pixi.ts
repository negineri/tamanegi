// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";
import GSAP from "gsap";
import { keyFlag } from "src/keyevent";

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
  if (!drawing && keyFlag == 1) {
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
