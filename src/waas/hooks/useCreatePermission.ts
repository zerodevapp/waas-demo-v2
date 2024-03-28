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
  type KernelSmartAccount,
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

export type CreatePermissionWriteArgs = Policy[] | undefined;

export type UseCreatePermissionKey = {
  validator: KernelValidator<EntryPoint> | null;
  policies: CreatePermissionWriteArgs;
  appId: string | null;
  client: PublicClient | undefined;
};

export type UseCreatePermissionArgs = {
  onSuccess?: (data: KernelSmartAccount<EntryPoint>) => void;
};

function mutationKey({ ...config }: UseCreatePermissionKey) {
  const { appId, policies, client, validator } = config;

  return [
    {
      entity: "CreatePermission",
      appId,
      client,
      validator,
      policies,
    },
  ] as const;
}

async function createSessionClient(
  appId: string,
  validator: KernelValidator<EntryPoint>,
  policies: Policy[],
  client: PublicClient
) {
  const sessionKey = createSessionKey();
  const sessionSigner = privateKeyToAccount(sessionKey);

  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(client, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: policies,
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

function mutationFn(config: UseCreatePermissionKey) {
  const { policies, validator, appId, client } = config;

  if (!appId) {
    throw new Error("No appId provided");
  }
  if (!validator) {
    throw new Error("No validator provided");
  }
  if (!policies) {
    throw new Error("No parameters provided");
  }
  if (!client) {
    throw new Error("No client provided");
  }

  return createSessionClient(appId, validator, policies, client);
}

export function useCreatePermission(args?: UseCreatePermissionArgs) {
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
      policies: undefined,
    }),
    mutationFn,
    onSuccess: args?.onSuccess,
  });

  useEffect(() => {
    if (error) setSessionKey(null);
  }, [error]);

  const write = useCallback(
    (policies: CreatePermissionWriteArgs) => {
      if (!appId || !validator || !client || !policies) return undefined;

      mutate({
        policies,
        appId,
        client,
        validator,
      });
    },
    [mutate, appId, validator, client]
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
