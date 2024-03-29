import { PolicyFlags, type Policy } from "@zerodev/permission-validator";
import { concat, encodeAbiParameters, keccak256, slice, type Hex } from "viem";

export const getPermissionId = (policies: Policy[] | undefined): Hex => {
  if (!policies) return "0x";
  const pIdData = encodeAbiParameters(
    [{ name: "policyAndSignerData", type: "bytes[]" }],
    [
      [
        ...policies.map((policy) =>
          concat([policy.getPolicyInfoInBytes(), policy.getPolicyData()])
        ),
        concat([PolicyFlags.FOR_ALL_VALIDATION]),
      ],
    ]
  );
  return slice(keccak256(pIdData), 0, 2);
};
