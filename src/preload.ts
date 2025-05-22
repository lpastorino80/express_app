import { ipcRenderer, contextBridge } from 'electron';
(() => {
  console.log("Add listeners")
  addEventListener("message", ev => {
    if (ev && ev.data && !ev.data.backend) {
      console.log("EXPRESS recibido:", ev.data);
      console.log("👉 Enviando por ipcRenderer:", ipcRenderer.send);
      ipcRenderer.send("EXPRESS", ev.data)
    }
  });
  ipcRenderer.on("EXPRESS_TO_CLIENT", (event, arg) => {
    console.log("EXPRESS_TO_CLIENT recibido:", arg);
    arg.status.backend = true
    window.postMessage(arg.status, '*');
  });
  ipcRenderer.on("EXPRESS_TO_CLIENT_ARTICLE", (event, arg) => {
    console.log("EXPRESS_TO_CLIENT_ARTICLE recibido:", arg);
    arg.status.backend = true
    window.postMessage(arg.status, '*');
  });
  contextBridge.exposeInMainWorld('electronAPI', {
    closeApp: () => ipcRenderer.send('close-app'),
    setConfigUrl: (key: string) => ipcRenderer.send('set-config-url', key),
    getLocalStorage: (key: string) => ipcRenderer.invoke('get-local-storage', key),
    getServerUrl: () => ipcRenderer.invoke('get-server-url'),
    getFiservLogoPath: () => ipcRenderer.invoke('get-logo-path'),
    checkVideo: () => ipcRenderer.invoke('check-video'),
  });
})();
