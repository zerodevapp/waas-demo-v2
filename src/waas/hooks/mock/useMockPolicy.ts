import { type Policy } from "@zerodev/permissions";
import { toGasPolicy, toSudoPolicy } from "@zerodev/permissions/policies";
import { useEffect, useState } from "react";
import { parseGwei } from "viem";

export type PolicyType = {
  maxGasAllowedInWei: string;
  policy: Policy[];
};

export function useMockedPolicy() {
  const [policies, setPolicies] = useState<PolicyType[]>();

  useEffect(() => {
    const getMockPolicy = async () => {
      const gasPolicyMeta = ["1000000000", "100000000"];
      const firstGasPolicy = toGasPolicy({
        allowed: parseGwei(gasPolicyMeta[0]),
      });
      const secondGasPolicy = toGasPolicy({
        allowed: parseGwei(gasPolicyMeta[1]),
      });
      const sudoPolicy = toSudoPolicy({});
      const firstPolicies = {
        maxGasAllowedInWei: gasPolicyMeta[0],
        policy: [firstGasPolicy, sudoPolicy],
      };
      const secondPolicies = {
        maxGasAllowedInWei: gasPolicyMeta[1],
        policy: [secondGasPolicy, sudoPolicy],
      };

      setPolicies([firstPolicies, secondPolicies]);
    };
    getMockPolicy();
  }, []);

  return {
    policies,
  };
}
