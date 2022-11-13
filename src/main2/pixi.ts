// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

export {};

const setup = async () => {
  const devices = (await navigator.mediaDevices.enumerateDevices())
    .filter((device) => device.kind === "videoinput")
    .map((device) => {
      return {
        text: device.label,
        value: device.deviceId,
      };
    });

  const video = document.getElementById("camera") as HTMLVideoElement;
  navigator.mediaDevices
    .getUserMedia({
      video: { deviceId: devices[0]["value"] },
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((e) => {
      console.log(e);
    });
};

setup();
