export interface ElectronAPI {
    setConfigUrl: (key: string) => Promise<string | null>;
    getLocalStorage: (key: string) => Promise<string | null>;
    getServerUrl: () => string;
    getVideoPath: () => string;
    getFiservLogoPath: () => string;
    checkVideo: () => Promise<string | null>;
    closeApp: () => null;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }