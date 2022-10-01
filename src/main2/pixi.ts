// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";

export default class Hilo {
  window: Window;
  app: PIXI.Application;
  constructor(window: Window, body: Document["body"]) {
    // Adjust the resolution for retina screens; along with
    // the autoDensity this transparently handles high resolutions
    PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;
    this.window = window;

    // The PixiJS application instance
    this.app = new PIXI.Application({
      resizeTo: window, // Auto fill the screen
      autoDensity: true, // Handles high DPI screens
      backgroundColor: 0xffffff,
    });

    // Add application canvas to body
    body.appendChild(this.app.view);

    // Create the scaled stage and then add stuff to it
    // this.createScaledContainer((container) => {});
  }

  // Clear the stage and create a new scaled container; the
  // provided callback will be called with the new container
  createScaledContainer(callback: (container: PIXI.Container) => void) {
    this.app.stage.removeChildren();

    // This is the stage for the new scene
    const container = new PIXI.Container();
    container.width = this.WIDTH;
    container.height = this.HEIGHT;
    container.scale.x = this.actualWidth() / this.WIDTH;
    container.scale.y = this.actualHeight() / this.HEIGHT;
    container.x = this.app.screen.width / 2 - this.actualWidth() / 2;
    container.y = this.app.screen.height / 2 - this.actualHeight() / 2;

    // Add the container to the stage and call the callback
    this.app.stage.addChild(container);
    callback(container);
  }

  // These functions are using getters to
  // simulate constant class variables

  get WIDTH() {
    return 375;
  }

  get HEIGHT() {
    return 667;
  }

  // The dynamic width and height lets us do some smart
  // scaling of the main game content; here we're just
  // using it to maintain a 9:16 aspect ratio and giving
  // our scenes a 375x667 stage to work with

  actualWidth() {
    const { width, height } = this.app.screen;
    const isWidthConstrained = width < (height * 9) / 16;
    return isWidthConstrained ? width : (height * 9) / 16;
  }

  actualHeight() {
    const { width, height } = this.app.screen;
    const isHeightConstrained = (width * 16) / 9 > height;
    return isHeightConstrained ? height : (width * 16) / 9;
  }
}

new Hilo(window, document.body);
