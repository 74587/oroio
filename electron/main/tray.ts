import { Tray, Menu, nativeImage, app, NativeImage } from 'electron';
import { createMainWindow } from './index';
import { useKey, maskKey, type KeyInfo } from './keyManager';

let tray: Tray | null = null;

function getTrayIcon(): NativeImage {
  // 16x16 black filled circle for macOS menubar template image
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA' +
    'iklEQVQ4T2NkoBAwUqifYdAb8P/f/w2MDAxqDAwM/xkZGP7BMRiDxBgY/jMw' +
    'MDL8h4v9Z2D8/5+RgQFqANgQBgYGJrAYnA/i/WdkRDGA4T/YdIgBcMkkGUCS' +
    'AX9BBsBdQawBSAbAXQF3BdQAuBjIAOJcAfcHyAAiDYC7AuoFuBgKA4hyAQYA' +
    'AM//KhER4OKUAAAASUVORK5CYII=';
  
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${base64}`);
  icon.setTemplateImage(true);
  return icon;
}

function formatUsage(info: KeyInfo): string {
  if (!info.usage || info.usage.total === null) {
    return 'No usage data';
  }
  const used = info.usage.used ?? 0;
  const total = info.usage.total;
  const percent = Math.round((used / total) * 100);
  return `${percent}% used · Expires: ${info.usage.expires}`;
}

function buildContextMenu(keys: KeyInfo[]): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [];
  
  // Header
  template.push({
    label: 'oroio',
    enabled: false,
  });
  template.push({ type: 'separator' });
  
  // Current key info
  const current = keys.find(k => k.isCurrent);
  if (current) {
    template.push({
      label: `Active: ${maskKey(current.key)}`,
      enabled: false,
    });
    template.push({
      label: formatUsage(current),
      enabled: false,
    });
    template.push({ type: 'separator' });
  }
  
  // Key list
  if (keys.length > 0) {
    template.push({
      label: 'Switch Key',
      submenu: keys.map(info => ({
        label: `${info.index}. ${maskKey(info.key)}${info.isCurrent ? ' ✓' : ''}`,
        type: 'radio' as const,
        checked: info.isCurrent,
        click: async () => {
          if (!info.isCurrent) {
            await useKey(info.index);
          }
        },
      })),
    });
    template.push({ type: 'separator' });
  }
  
  // Actions
  template.push({
    label: 'Open Dashboard',
    click: () => createMainWindow(),
    accelerator: 'CmdOrCtrl+O',
  });
  
  template.push({ type: 'separator' });
  
  template.push({
    label: 'Quit',
    click: () => app.quit(),
    accelerator: 'CmdOrCtrl+Q',
  });
  
  return Menu.buildFromTemplate(template);
}

export function initTray(keys: KeyInfo[]): Tray {
  if (tray) {
    tray.destroy();
  }
  
  tray = new Tray(getTrayIcon());
  tray.setToolTip('oroio - API Key Manager');
  
  updateTrayMenu(keys);
  
  tray.on('click', () => {
    if (tray) {
      tray.popUpContextMenu();
    }
  });
  
  tray.on('double-click', () => {
    createMainWindow();
  });
  
  return tray;
}

export function updateTrayMenu(keys: KeyInfo[]): void {
  if (!tray) return;
  
  const menu = buildContextMenu(keys);
  tray.setContextMenu(menu);
  
  // Update tooltip with current key info
  const current = keys.find(k => k.isCurrent);
  if (current && current.usage) {
    const percent = current.usage.total 
      ? Math.round(((current.usage.used ?? 0) / current.usage.total) * 100)
      : 0;
    tray.setToolTip(`oroio · ${percent}% used`);
  }
}

export function getTray(): Tray | null {
  return tray;
}
