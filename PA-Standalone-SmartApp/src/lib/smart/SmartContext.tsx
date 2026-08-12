"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { SmartContext } from "./smartLaunch";

interface SmartContextValue {
  context: SmartContext | null;
  setContext: (ctx: SmartContext) => void;
}

const SmartCtx = createContext<SmartContextValue | null>(null);

export function SmartProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<SmartContext | null>(null);

  return (
    <SmartCtx.Provider value={{ context, setContext }}>
      {children}
    </SmartCtx.Provider>
  );
}

export function useSmartContext(): SmartContextValue {
  const ctx = useContext(SmartCtx);
  if (!ctx) throw new Error("useSmartContext must be inside <SmartProvider>");
  return ctx;
}
