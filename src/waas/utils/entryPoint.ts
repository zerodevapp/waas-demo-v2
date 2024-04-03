import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { KernelVersionType } from "../types";

export const getEntryPoint = (): EntryPoint => {
  return ENTRYPOINT_ADDRESS_V07;
};

export const getEntryPointFromVersion = (
  version: KernelVersionType
): EntryPoint => {
  if (version === "v2") return ENTRYPOINT_ADDRESS_V06;
  return ENTRYPOINT_ADDRESS_V07;
};
