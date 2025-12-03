import { contextBridge, ipcRenderer } from 'electron';

export interface OroioAPI {
  keys: {
    list: () => Promise<any[]>;
    current: () => Promise<any | null>;
    add: (key: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    remove: (index: number) => Promise<{ success: boolean; message?: string; error?: string }>;
    use: (index: number) => Promise<{ success: boolean; message?: string; error?: string }>;
    refresh: () => Promise<{ success: boolean; error?: string }>;
  };
  data: {
    read: (filename: string) => Promise<ArrayBuffer | null>;
  };
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

const api: OroioAPI = {
  keys: {
    list: () => ipcRenderer.invoke('keys:list'),
    current: () => ipcRenderer.invoke('keys:current'),
    add: (key: string) => ipcRenderer.invoke('keys:add', key),
    remove: (index: number) => ipcRenderer.invoke('keys:remove', index),
    use: (index: number) => ipcRenderer.invoke('keys:use', index),
    refresh: () => ipcRenderer.invoke('keys:refresh'),
  },
  data: {
    read: async (filename: string): Promise<ArrayBuffer | null> => {
      const buffer = await ipcRenderer.invoke('data:read', filename);
      if (buffer) {
        // Convert Node Buffer to ArrayBuffer
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      }
      return null;
    },
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

contextBridge.exposeInMainWorld('oroio', api);

declare global {
  interface Window {
    oroio: OroioAPI;
  }
}
