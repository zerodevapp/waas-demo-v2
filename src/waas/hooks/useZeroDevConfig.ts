import { useContext } from "react";
import { ZeroDevAppContext } from "../components/ZeroDevProvider/ZeroDevAppContext";

export function useZeroDevConfig() {
  const { appId, chain } = useContext(ZeroDevAppContext);

  return { appId, chain };
}
