import React, { createContext, useCallback, useContext, useState } from "react";
import { View } from "react-native";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast } from "@/components/Toast";

const UIContext = createContext(null);

let counter = 0;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const dismissToast = useCallback((id) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts) => {
    counter += 1;
    const id = `t-${counter}`;
    const next = {
      id,
      type: opts.type || "info",
      title: opts.title,
      message: opts.message || opts.text || "",
      duration: opts.duration,
    };
    setToasts((curr) => [...curr, next]);
    return id;
  }, []);

  const confirm = useCallback((opts) => {
    setDialog({
      title: opts.title || "Confirmar",
      message: opts.message,
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
      destructive: opts.destructive,
      icon: opts.icon,
      onConfirm: opts.onConfirm,
    });
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </View>
      <ConfirmDialog dialog={dialog} onClose={closeDialog} />
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    return {
      toast: () => {},
      confirm: (opts) => opts?.onConfirm && opts.onConfirm(),
    };
  }
  return ctx;
}
