import Constants from "expo-constants";

/**
 * Wrapper seguro alrededor de expo-share-intent.
 *
 * El módulo nativo NO existe en Expo Go (solo en development builds o APK/IPA
 * reales). Si lo importamos directamente en _layout.jsx, Expo Go crashea con
 * "Native module not found".
 *
 * Esta función intenta cargar el hook real solo cuando NO estamos en Expo Go.
 * En Expo Go devuelve un hook "no-op" que nunca dispara nada — la app funciona
 * normal pero el share-intent simplemente no está disponible (esperado).
 */

const isExpoGo = Constants.appOwnership === "expo";

let realHook = null;
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    realHook = require("expo-share-intent").useShareIntent;
  } catch (e) {
    // Módulo no disponible (probablemente estamos en web o Expo Go) — sin
    // problemas, devolveremos el no-op hook.
    realHook = null;
  }
}

const noopResult = {
  hasShareIntent: false,
  shareIntent: null,
  resetShareIntent: () => {},
  error: null,
};

function useNoopShareIntent() {
  return noopResult;
}

export const useShareIntentSafe = realHook || useNoopShareIntent;

export const SHARE_INTENT_AVAILABLE = !!realHook;
