// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import cv from "@techstark/opencv-js";

export async function loadDataFile(cvFilePath: string, url: string) {
  // see https://docs.opencv.org/master/utils.js
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = new Uint8Array(buffer);
  cv.FS_createDataFile("/", cvFilePath, data, true, false, false);
}
