import { type Policy } from "@zerodev/permission-validator";
import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { createSession, getAllSession } from "../../sessions/manageSession";

interface SessionContextValue {
  session: SessionType | null;
  setSession: (
    permissionId: `0x${string}`,
    smartAccount: `0x${string}`,
    enableSignature: `0x${string}`,
    policies: Policy[],
    sessionKey: `0x${string}`
  ) => void;
}

interface SessionProviderProps {
  children: ReactNode;
}

export type SessionInfoType = {
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: Policy[];
  sessionKey: `0x${string}`;
};

export const SessionContext = createContext<SessionContextValue>({
  session: {},
  setSession: () => {},
});

export type SessionType = {
  [permissionId: `0x${string}`]: SessionInfoType;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionType>({});

  useEffect(() => {
    const sessions = getAllSession();
    setSession(sessions || {});
  }, []);

  function updateSession(
    permissionId: `0x${string}`,
    smartAccount: `0x${string}`,
    enableSignature: `0x${string}`,
    policies: Policy[],
    sessionKey: `0x${string}`
  ) {
    createSession(
      permissionId,
      smartAccount,
      enableSignature,
      policies,
      sessionKey
    );
    setSession((prev) => ({
      ...prev,
      [permissionId]: {
        smartAccount,
        enableSignature,
        policies,
        sessionKey,
      },
    }));
  }

  return (
    <SessionContext.Provider
      value={useMemo(
        () => ({
          session,
          setSession: updateSession,
        }),
        [session]
      )}
    >
      {children}
    </SessionContext.Provider>
  );
}
