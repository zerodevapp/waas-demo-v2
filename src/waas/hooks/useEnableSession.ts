import { createSessionKey, setSessionKey, useValidator } from "@/waas";
import { useMutation } from "@tanstack/react-query";
import {
  toPermissionValidator,
  type Policy,
} from "@zerodev/permission-validator";
import { toECDSASigner } from "@zerodev/permission-validator/signers";
import {
  KernelV3ExecuteAbi,
  KernelValidator,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useCallback, useEffect } from "react";
import {
  encodeFunctionData,
  getAbiItem,
  http,
  parseAbi,
  toFunctionSelector,
  zeroAddress,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getEntryPoint } from "../utils/entryPoint";
import { useAppId } from "./useAppId";

export type EnableSessionWriteArgs = Policy[] | undefined;

export type UseEnableSessionArgs = {
  validator: KernelValidator<EntryPoint> | null;
  parameters: EnableSessionWriteArgs;
  appId: string | null;
  client: PublicClient | undefined;
};

function mutationKey({ ...config }: UseEnableSessionArgs) {
  const { appId, parameters, client, validator } = config;

  return [
    {
      entity: "enableSession",
      appId,
      client,
      validator,
      parameters,
    },
  ] as const;
}

async function createSessionClient(
  appId: string,
  validator: KernelValidator<EntryPoint>,
  parameters: Policy[],
  client: PublicClient
) {
  const sessionKey = createSessionKey();
  const sessionSigner = privateKeyToAccount(sessionKey);

  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(client, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: parameters,
  });

  const permissionAccount = await createKernelAccount(client, {
    entryPoint: getEntryPoint(),
    plugins: {
      sudo: validator,
      regular: permissionValidator,
      entryPoint: getEntryPoint(),
      executorData: {
        executor: zeroAddress,
        selector: toFunctionSelector(
          getAbiItem({ abi: KernelV3ExecuteAbi, name: "execute" })
        ),
      },
    },
  });

  const kernelClient = createKernelAccountClient({
    account: permissionAccount,
    chain: sepolia,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId}?paymasterProvider=PIMLICO`
    ),
    entryPoint: getEntryPoint(),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const kernelPaymaster = createZeroDevPaymasterClient({
          entryPoint: getEntryPoint(),
          chain: sepolia,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v2/paymaster/${appId}?paymasterProvider=PIMLICO`
          ),
        });
        return kernelPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: getEntryPoint(),
        });
      },
    },
  });

  const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const contractABI = parseAbi([
    "function mint(address _to) public",
    "function balanceOf(address owner) external view returns (uint256 balance)",
  ]);

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await permissionAccount.encodeCallData({
        to: contractAddress,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: contractABI,
          functionName: "mint",
          args: [permissionAccount.address],
        }),
      }),
    },
  });
  console.log(userOpHash);
  return permissionAccount;
}

function mutationFn(config: UseEnableSessionArgs) {
  const { parameters, validator, appId, client } = config;

  if (!appId) {
    throw new Error("No appId provided");
  }
  if (!validator) {
    throw new Error("No validator provided");
  }
  if (!parameters) {
    throw new Error("No parameters provided");
  }
  if (!client) {
    throw new Error("No client provided");
  }

  return createSessionClient(appId, validator, parameters, client);
}

export function useEnableSession() {
  const { validator } = useValidator();
  const { appId } = useAppId();
  const client = usePublicClient();

  const {
    data,
    error,
    isError,
    isIdle,
    isSuccess,
    mutate,
    mutateAsync,
    reset,
    status,
    variables,
  } = useMutation({
    mutationKey: mutationKey({
      appId,
      client,
      validator,
      parameters: undefined,
    }),
    mutationFn,
  });

  useEffect(() => {
    if (error) setSessionKey(null);
  }, [error]);

  const write = useCallback(
    (parameters: EnableSessionWriteArgs) => {
      if (!appId || !validator || !client || !parameters) return undefined;

      mutate({
        parameters,
        appId,
        client,
        validator,
      });
    },
    [mutate, appId, validator]
  );

  return {
    data,
    error,
    isError,
    isIdle,
    isSuccess,
    reset,
    status,
    variables,
    write,
  };
}
