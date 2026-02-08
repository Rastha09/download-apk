import { useState, useCallback } from "react";

const STORAGE_KEY_PREFIX = "apk_cooldown_";
const SPAM_KEY_PREFIX = "apk_spam_";
const BASE_COOLDOWN = 15; // seconds
const SPAM_COOLDOWN_STEP = 15; // seconds added per rapid click
const MAX_COOLDOWN = 45; // seconds

interface CooldownState {
  isOnCooldown: boolean;
  remainingSeconds: number;
}

export function useDownloadCooldown() {
  const [cooldownState, setCooldownState] = useState<Record<string, CooldownState>>({});

  const checkCooldown = useCallback((apkId: string): { allowed: boolean; remaining: number } => {
    const lastClickStr = localStorage.getItem(STORAGE_KEY_PREFIX + apkId);
    const spamCountStr = localStorage.getItem(SPAM_KEY_PREFIX + apkId);

    if (!lastClickStr) {
      return { allowed: true, remaining: 0 };
    }

    const lastClick = parseInt(lastClickStr, 10);
    const spamCount = spamCountStr ? parseInt(spamCountStr, 10) : 0;
    const cooldownDuration = Math.min(BASE_COOLDOWN + spamCount * SPAM_COOLDOWN_STEP, MAX_COOLDOWN);
    const elapsed = (Date.now() - lastClick) / 1000;
    const remaining = Math.ceil(cooldownDuration - elapsed);

    if (remaining > 0) {
      // Increment spam counter for rapid clicks
      localStorage.setItem(SPAM_KEY_PREFIX + apkId, String(Math.min(spamCount + 1, 2)));
      setCooldownState((prev) => ({
        ...prev,
        [apkId]: { isOnCooldown: true, remainingSeconds: remaining },
      }));
      return { allowed: false, remaining };
    }

    // Cooldown expired, reset spam counter
    localStorage.removeItem(SPAM_KEY_PREFIX + apkId);
    return { allowed: true, remaining: 0 };
  }, []);

  const recordClick = useCallback((apkId: string) => {
    localStorage.setItem(STORAGE_KEY_PREFIX + apkId, String(Date.now()));
    setCooldownState((prev) => ({
      ...prev,
      [apkId]: { isOnCooldown: true, remainingSeconds: BASE_COOLDOWN },
    }));
  }, []);

  return { checkCooldown, recordClick, cooldownState };
}
