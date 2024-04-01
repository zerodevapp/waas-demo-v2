import { type Policy } from "@zerodev/permission-validator";
import { type Hex } from "viem";

type EncodedPolicy = {
  getPolicyData: `0x${string}`;
  getPolicyInfoInBytes: `0x${string}`;
};

export type EncodedSessionInfoType = {
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: EncodedPolicy[];
  sessionKey: `0x${string}`;
};

export type EncodedSessionType = {
  [permissionId: `0x${string}`]: EncodedSessionInfoType;
};

export function serializePolicy(policies: Policy[]) {
  return policies.map((policy) => ({
    getPolicyData: policy.getPolicyData(),
    getPolicyInfoInBytes: policy.getPolicyInfoInBytes(),
  }));
}

export function desirializePolicy(encodedPolicy: EncodedPolicy): Policy {
  return {
    getPolicyData: (permissionID?: Hex) => encodedPolicy.getPolicyData,
    getPolicyInfoInBytes: () => encodedPolicy.getPolicyInfoInBytes,
  };
}
