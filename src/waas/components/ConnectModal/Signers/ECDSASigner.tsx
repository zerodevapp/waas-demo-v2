import { useValidator } from "@/waas";
import { Loader } from "@mantine/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { walletClientToSmartAccountSigner } from "permissionless";
import { useEffect } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { getEntryPoint } from "../../../utils/entryPoint";

export default function ECDSASigner() {
  const { setValidator } = useValidator();
  const { data } = useWalletClient();
  const client = usePublicClient();

  useEffect(() => {
    const createValidator = async () => {
      if (!data || !client) return;
      const ecdsaValidator = await signerToEcdsaValidator(client, {
        entryPoint: getEntryPoint(),
        signer: walletClientToSmartAccountSigner(data),
      });
      setValidator(ecdsaValidator);
    };
    createValidator();
  }, [data, client]);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1>ECDSA Signer Connecting...</h1>
      {<Loader />}
    </div>
  );
}
