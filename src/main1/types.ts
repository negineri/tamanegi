// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

declare global {
  interface Window {
    myAPI: IMyAPI;
  }
}
export interface IMyAPI {
  open: () => any;
}
