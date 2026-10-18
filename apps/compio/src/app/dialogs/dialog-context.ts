import { createContext, useContext } from "react";
import type { DialogRequest } from "./types";

export interface DialogContextValue {
  /** The single active dialog, or null when none is open. Plain data by design — no React node stored, so it stays easy to lift out of React later. */
  current: DialogRequest | null;
  openDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);

  if (!context) throw new Error("useDialog must be used within a DialogProvider");

  return context;
};
