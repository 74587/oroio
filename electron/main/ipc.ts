import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  getKeyList,
  getCurrentKey,
  addKey,
  removeKey,
  useKey,
  refreshCache,
  type KeyInfo,
} from './keyManager';
import { updateTrayMenu } from './tray';
import { checkAndNotify } from './notifier';

const OROIO_DIR = path.join(os.homedir(), '.oroio');

export function registerIpcHandlers(): void {
  // Get all keys
  ipcMain.handle('keys:list', async (): Promise<KeyInfo[]> => {
    return getKeyList();
  });

  // Get current key
  ipcMain.handle('keys:current', async (): Promise<KeyInfo | null> => {
    return getCurrentKey();
  });

  // Add a key
  ipcMain.handle('keys:add', async (_event, key: string) => {
    const result = await addKey(key);
    if (result.success) {
      const keys = await getKeyList();
      updateTrayMenu(keys);
      notifyAllWindows('keys-changed');
    }
    return result;
  });

  // Remove a key
  ipcMain.handle('keys:remove', async (_event, index: number) => {
    const result = await removeKey(index);
    if (result.success) {
      const keys = await getKeyList();
      updateTrayMenu(keys);
      checkAndNotify(keys);
      notifyAllWindows('keys-changed');
    }
    return result;
  });

  // Switch to a key
  ipcMain.handle('keys:use', async (_event, index: number) => {
    const result = await useKey(index);
    if (result.success) {
      const keys = await getKeyList();
      updateTrayMenu(keys);
      notifyAllWindows('keys-changed');
    }
    return result;
  });

  // Refresh cache
  ipcMain.handle('keys:refresh', async () => {
    const result = await refreshCache();
    if (result.success) {
      const keys = await getKeyList();
      updateTrayMenu(keys);
      checkAndNotify(keys);
      notifyAllWindows('keys-changed');
    }
    return result;
  });

  // Read raw data file (for web compatibility)
  ipcMain.handle('data:read', async (_event, filename: string): Promise<Buffer | null> => {
    const allowedFiles = ['keys.enc', 'current', 'list_cache.b64'];
    if (!allowedFiles.includes(filename)) {
      return null;
    }
    
    try {
      const filepath = path.join(OROIO_DIR, filename);
      return await fs.readFile(filepath);
    } catch {
      return null;
    }
  });
}

function notifyAllWindows(channel: string, ...args: any[]): void {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  });
}
