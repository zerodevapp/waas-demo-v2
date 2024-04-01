import { useContext } from "react";
import { SessionContext } from "../components/ZeroDevProvider/SessionContext";

export function useSession() {
  const { session, setSession } = useContext(SessionContext);

  return {
    session,
    setSession,
  };
}
