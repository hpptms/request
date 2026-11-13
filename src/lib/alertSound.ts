import { useSyncExternalStore } from "react";
import { getAudioContext, playChime } from "./playChime";

// The visitor's own sound settings for request alerts (useMyRequestAlerts).
// Off unless they turn it on. Everything lives in this browser only — the
// on/off/volume/choice in localStorage, an uploaded sound file in IndexedDB
// (too big for localStorage, and kept as a Blob rather than base64). Nothing
// is sent to the backend.

export interface AlertSoundSettings {
  enabled: boolean;
  // 0–1.
  volume: number;
  // "default" = the built-in chime (playChime); "custom" = the file the
  // visitor picked, falling back to the chime if it can't be loaded.
  kind: "default" | "custom";
  // Display name of the stored custom file, null if none.
  customName: string | null;
}

const SETTINGS_KEY = "recest:alertSound";
const DEFAULT_SETTINGS: AlertSoundSettings = { enabled: false, volume: 0.7, kind: "default", customName: null };

// Upper bounds for a custom sound: small enough to keep IndexedDB use
// trivial, and an alert shouldn't play a whole song.
export const MAX_CUSTOM_SOUND_BYTES = 1024 * 1024;
const MAX_PLAY_SECONDS = 5;

function readSettings(): AlertSoundSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AlertSoundSettings>;
    return {
      enabled: parsed.enabled === true,
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : DEFAULT_SETTINGS.volume,
      kind: parsed.kind === "custom" ? "custom" : "default",
      customName: typeof parsed.customName === "string" ? parsed.customName : null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let settings = readSettings();
const listeners = new Set<() => void>();

export function getAlertSoundSettings(): AlertSoundSettings {
  return settings;
}

export function updateAlertSoundSettings(patch: Partial<AlertSoundSettings>): void {
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Private mode etc. — the setting still holds for this page view.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab of the site changed the settings.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SETTINGS_KEY) return;
    settings = readSettings();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAlertSoundSettings(): AlertSoundSettings {
  return useSyncExternalStore(subscribe, getAlertSoundSettings);
}

// --- Custom sound file (IndexedDB) ---

const DB_NAME = "recest-alerts";
const STORE = "sounds";
const CUSTOM_KEY = "custom";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

// Decoded once per page view; cleared when the file changes.
let decodedCustom: AudioBuffer | null = null;

async function decode(blob: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  if (!ctx) throw new Error("このブラウザは音声の再生に対応していません");
  return ctx.decodeAudioData(await blob.arrayBuffer());
}

// Validates (size, decodable as audio) before storing, so a broken file is
// rejected at pick time instead of failing silently at alert time.
export async function saveCustomSound(file: File): Promise<void> {
  if (file.size > MAX_CUSTOM_SOUND_BYTES) throw new Error("音声ファイルは1MB以下にしてください");
  let buffer: AudioBuffer;
  try {
    buffer = await decode(file);
  } catch {
    throw new Error("この音声ファイルは再生できませんでした（mp3・wav・m4a・oggなどを選んでください）");
  }
  await withStore("readwrite", (s) => s.put(file, CUSTOM_KEY));
  decodedCustom = buffer;
  updateAlertSoundSettings({ kind: "custom", customName: file.name });
}

export async function deleteCustomSound(): Promise<void> {
  try {
    await withStore("readwrite", (s) => s.delete(CUSTOM_KEY));
  } catch {
    // Nothing stored / storage unavailable — clearing the setting is enough.
  }
  decodedCustom = null;
  updateAlertSoundSettings({ kind: "default", customName: null });
}

async function loadCustom(): Promise<AudioBuffer | null> {
  if (decodedCustom) return decodedCustom;
  const blob = await withStore<Blob | undefined>("readonly", (s) => s.get(CUSTOM_KEY));
  if (!blob) return null;
  decodedCustom = await decode(blob);
  return decodedCustom;
}

function playBuffer(buffer: AudioBuffer, volume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + MAX_PLAY_SECONDS);
}

// Plays the chosen alert sound at the chosen volume. `force` ignores the
// on/off switch (for the settings dialog's 試しに鳴らす). Best-effort: a
// browser may still keep a background tab silent until the visitor has
// interacted with the page.
export async function playAlertSound(force = false): Promise<void> {
  const s = settings;
  if (!force && !s.enabled) return;
  if (s.volume <= 0) return;
  if (s.kind === "custom") {
    try {
      const buffer = await loadCustom();
      if (buffer) {
        playBuffer(buffer, s.volume);
        return;
      }
    } catch {
      // Fall back to the default chime below.
    }
  }
  playChime(s.volume);
}
