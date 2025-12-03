export interface KeyUsage {
  balance: number | null;
  total: number | null;
  used: number | null;
  expires: string;
  raw: string;
}

export interface KeyInfo {
  key: string;
  index: number;
  isCurrent: boolean;
  usage: KeyUsage | null;
}

// Detect if running in Electron
export const isElectron = typeof window !== 'undefined' && 'oroio' in window;

export async function fetchEncryptedKeys(): Promise<ArrayBuffer> {
  if (isElectron) {
    const data = await window.oroio.data.read('keys.enc');
    if (!data) throw new Error('Failed to read keys.enc');
    return data;
  }
  const res = await fetch('/data/keys.enc');
  if (!res.ok) throw new Error('Failed to fetch keys.enc');
  return res.arrayBuffer();
}

export async function fetchCurrentIndex(): Promise<number> {
  if (isElectron) {
    const data = await window.oroio.data.read('current');
    if (!data) return 1;
    const text = new TextDecoder().decode(data);
    return parseInt(text.trim(), 10) || 1;
  }
  const res = await fetch('/data/current');
  if (!res.ok) return 1;
  const text = await res.text();
  return parseInt(text.trim(), 10) || 1;
}

export async function fetchCache(): Promise<Map<number, KeyUsage>> {
  let text: string;
  
  if (isElectron) {
    const data = await window.oroio.data.read('list_cache.b64');
    if (!data) return new Map();
    text = new TextDecoder().decode(data);
  } else {
    const res = await fetch('/data/list_cache.b64');
    if (!res.ok) return new Map();
    text = await res.text();
  }
  
  const lines = text.split('\n');
  if (lines.length < 3) return new Map();
  
  const result = new Map<number, KeyUsage>();
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [idxStr, b64] = line.split('\t');
    if (!idxStr || !b64) continue;
    
    try {
      const decoded = atob(b64);
      const usage = parseUsageInfo(decoded);
      result.set(parseInt(idxStr, 10), usage);
    } catch {
      // skip invalid entries
    }
  }
  
  return result;
}

function parseUsageInfo(text: string): KeyUsage {
  const lines = text.split('\n');
  const data: Record<string, string> = {};
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      data[key] = valueParts.join('=');
    }
  }
  
  return {
    balance: data['BALANCE_NUM'] ? parseFloat(data['BALANCE_NUM']) : null,
    total: data['TOTAL'] ? parseFloat(data['TOTAL']) : null,
    used: data['USED'] ? parseFloat(data['USED']) : null,
    expires: data['EXPIRES'] || '?',
    raw: data['RAW'] || '',
  };
}

export async function addKey(key: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isElectron) {
    return window.oroio.keys.add(key);
  }
  const res = await fetch('/api/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  return res.json();
}

export async function removeKey(index: number): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isElectron) {
    return window.oroio.keys.remove(index);
  }
  const res = await fetch('/api/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index }),
  });
  return res.json();
}

export async function useKey(index: number): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isElectron) {
    return window.oroio.keys.use(index);
  }
  const res = await fetch('/api/use', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index }),
  });
  return res.json();
}

export async function refreshCache(): Promise<{ success: boolean }> {
  if (isElectron) {
    return window.oroio.keys.refresh();
  }
  const res = await fetch('/api/refresh', { method: 'POST' });
  return res.json();
}

// Type declaration for Electron window
declare global {
  interface Window {
    oroio: {
      keys: {
        list: () => Promise<KeyInfo[]>;
        current: () => Promise<KeyInfo | null>;
        add: (key: string) => Promise<{ success: boolean; message?: string; error?: string }>;
        remove: (index: number) => Promise<{ success: boolean; message?: string; error?: string }>;
        use: (index: number) => Promise<{ success: boolean; message?: string; error?: string }>;
        refresh: () => Promise<{ success: boolean; error?: string }>;
      };
      data: {
        read: (filename: string) => Promise<ArrayBuffer | null>;
      };
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
    };
  }
}
