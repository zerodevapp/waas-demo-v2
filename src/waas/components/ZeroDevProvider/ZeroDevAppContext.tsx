import { ReactNode, createContext } from "react";

interface ZeroDevAppContextValue {
  appId: string | null;
}

export const ZeroDevAppContext = createContext<ZeroDevAppContextValue>({
  appId: null,
});

interface ZeroDevAppProviderProps {
  children: ReactNode;
  appId: string | null;
}

export function ZeroDevAppProvider({
  children,
  appId,
}: ZeroDevAppProviderProps) {
  return (
    <ZeroDevAppContext.Provider
      value={{
        appId,
      }}
    >
      {children}
    </ZeroDevAppContext.Provider>
  );
}
