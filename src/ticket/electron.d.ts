export interface ElectronAPI {
    getLocalStorage: (key: string) => Promise<string | null>;
    getServerUrl: () => string;
    getVideoPath: () => string;
    checkVideo: () => Promise<string | null>;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }