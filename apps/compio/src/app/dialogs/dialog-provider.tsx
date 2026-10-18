import { useCallback, useMemo, useState, type PropsWithChildren, type ReactElement } from "react";
import { DialogContext } from "./dialog-context";
import type { DialogRequest } from "./types";

export const DialogProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [current, setCurrent] = useState<DialogRequest | null>(null);

  const openDialog = useCallback((request: DialogRequest) => setCurrent(request), []);
  const closeDialog = useCallback(() => setCurrent(null), []);

  const value = useMemo(
    () => ({ current, openDialog, closeDialog }),
    [current, openDialog, closeDialog],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
};
