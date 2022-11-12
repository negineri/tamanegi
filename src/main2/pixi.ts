// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

const video = document.getElementById("camera") as HTMLVideoElement;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false,
  })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
  })
  .catch((e) => {
    console.log(e);
  });
