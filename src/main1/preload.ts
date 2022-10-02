// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

const apiKey = "api";

class ContextBridgeApi {
  open = () => {
    return ipcRenderer.invoke("open");
  };
  loadFnt = () => {
    return ipcRenderer.invoke("loadFnt");
  };
}

contextBridge.exposeInMainWorld(apiKey, new ContextBridgeApi());

declare global {
  interface Window {
    [apiKey]: ContextBridgeApi;
  }
}
