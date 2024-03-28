import { type Policy } from "@zerodev/permission-validator";
import {
  toGasPolicy,
  toSudoPolicy,
} from "@zerodev/permission-validator/policies";
import { useEffect, useState } from "react";

export function useMockedPolicy() {
  const [policies, setPolicies] = useState<Policy[]>();

  useEffect(() => {
    const getMockPolicy = async () => {
      const gasPolicy = await toGasPolicy({
        maxGasAllowedInWei: 1000000000000000000n,
      });
      const sudoPolicy = await toSudoPolicy({});
      setPolicies([gasPolicy, sudoPolicy]);
    };
    getMockPolicy();
  }, []);

  return {
    policies,
  };
}
