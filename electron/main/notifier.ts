import { Notification, app } from 'electron';
import type { KeyInfo } from './keyManager';

interface NotificationState {
  lowBalanceNotified: Set<number>;
  expiryNotified: Set<number>;
  allExhaustedNotified: boolean;
}

const state: NotificationState = {
  lowBalanceNotified: new Set(),
  expiryNotified: new Set(),
  allExhaustedNotified: false,
};

const LOW_BALANCE_THRESHOLD = 0.2; // 20% remaining
const EXPIRY_WARNING_DAYS = 1; // Warn 1 day before

function showNotification(title: string, body: string, urgency: 'normal' | 'critical' = 'normal'): void {
  if (!Notification.isSupported()) return;
  
  const notification = new Notification({
    title,
    body,
    silent: urgency !== 'critical',
  });
  
  notification.show();
}

function isExpiringSoon(expiresStr: string): boolean {
  if (!expiresStr || expiresStr === '?') return false;
  
  try {
    // Parse date like "2024-12-25" or "Dec 25, 2024"
    const expiryDate = new Date(expiresStr);
    if (isNaN(expiryDate.getTime())) return false;
    
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    return diffDays > 0 && diffDays <= EXPIRY_WARNING_DAYS;
  } catch {
    return false;
  }
}

function isLowBalance(info: KeyInfo): boolean {
  if (!info.usage || info.usage.total === null || info.usage.balance === null) {
    return false;
  }
  
  const ratio = info.usage.balance / info.usage.total;
  return ratio <= LOW_BALANCE_THRESHOLD && ratio > 0;
}

function isExhausted(info: KeyInfo): boolean {
  if (!info.usage || info.usage.balance === null) return false;
  return info.usage.balance <= 0;
}

export function checkAndNotify(keys: KeyInfo[]): void {
  // Check for low balance
  for (const key of keys) {
    if (isLowBalance(key) && !state.lowBalanceNotified.has(key.index)) {
      const percent = Math.round((key.usage!.balance! / key.usage!.total!) * 100);
      showNotification(
        'Key Balance Low',
        `Key #${key.index} has only ${percent}% remaining`,
        'normal'
      );
      state.lowBalanceNotified.add(key.index);
    }
    
    // Clear notification state if balance recovered
    if (!isLowBalance(key) && state.lowBalanceNotified.has(key.index)) {
      state.lowBalanceNotified.delete(key.index);
    }
  }
  
  // Check for expiring keys
  for (const key of keys) {
    if (key.usage && isExpiringSoon(key.usage.expires) && !state.expiryNotified.has(key.index)) {
      showNotification(
        'Key Expiring Soon',
        `Key #${key.index} expires on ${key.usage.expires}`,
        'normal'
      );
      state.expiryNotified.add(key.index);
    }
  }
  
  // Check if all keys exhausted
  const allExhausted = keys.length > 0 && keys.every(k => isExhausted(k));
  if (allExhausted && !state.allExhaustedNotified) {
    showNotification(
      'All Keys Exhausted!',
      'All your API keys have been used up. Add new keys to continue.',
      'critical'
    );
    state.allExhaustedNotified = true;
  } else if (!allExhausted) {
    state.allExhaustedNotified = false;
  }
}

export function initNotifier(keys: KeyInfo[]): void {
  // Initial check
  checkAndNotify(keys);
  
  // Periodic check every 5 minutes
  setInterval(async () => {
    // Re-import to get fresh data
    const { getKeyList } = await import('./keyManager');
    const freshKeys = await getKeyList();
    checkAndNotify(freshKeys);
  }, 5 * 60 * 1000);
}

export function resetNotificationState(): void {
  state.lowBalanceNotified.clear();
  state.expiryNotified.clear();
  state.allExhaustedNotified = false;
}
