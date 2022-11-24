// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

window.addEventListener(
  "keydown",
  (event) => {
    downHandler(event);
  },
  false
);
window.addEventListener(
  "keyup",
  (event) => {
    upHandler(event);
  },
  false
);

export let keyFlag = 0;

function downHandler(e: KeyboardEvent) {
  switch (e.key) {
    case "t":
      keyFlag = 1;
      break;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function upHandler(e: KeyboardEvent) {
  keyFlag = 0;
}
