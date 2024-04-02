import { type Policy } from "@zerodev/permission-validator";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createSession, getAllSession } from "../../sessions/manageSession";

type UpdateSessionArgs = {
  sessionId: `0x${string}`;
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: Policy[];
  sessionKey: `0x${string}`;
};

interface SessionContextValue {
  sessions: SessionType | null;
  updateSession: (args: UpdateSessionArgs) => void;
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
  sessions: {},
  updateSession: () => {},
});

export type SessionType = {
  [sessionId: `0x${string}`]: SessionInfoType;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessions, setSessions] = useState<SessionType>({});

  useEffect(() => {
    const allSession = getAllSession();
    setSessions(allSession || {});
  }, []);

  function updateSession({
    sessionId,
    smartAccount,
    enableSignature,
    policies,
    sessionKey,
  }: UpdateSessionArgs) {
    createSession(
      sessionId,
      smartAccount,
      enableSignature,
      policies,
      sessionKey
    );
    setSessions((prev) => ({
      ...prev,
      [sessionId]: {
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
          sessions,
          updateSession: updateSession,
        }),
        [sessions]
      )}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useUpdateSession() {
  const { updateSession } = useContext(SessionContext);

  return { updateSession };
}
