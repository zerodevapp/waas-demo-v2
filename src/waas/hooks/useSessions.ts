import { useContext } from "react";
import { SessionContext } from "../components/ZeroDevProvider/SessionContext";

export function useSessions() {
  const { sessions } = useContext(SessionContext);

  return sessions;
}
