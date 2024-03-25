import { useContext } from "react";
import { ZeroDevAppContext } from "../components/ZeroDevProvider/ZeroDevAppContext";

export function useAppId() {
  const { appId } = useContext(ZeroDevAppContext);

  return { appId };
}
