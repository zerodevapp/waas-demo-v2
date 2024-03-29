import { useMutation } from "@tanstack/react-query";
import { Policy, toPermissionValidator } from "@zerodev/permission-validator";
import { toECDSASigner } from "@zerodev/permission-validator/signers";
import {
  KernelV3ExecuteAbi,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelValidator,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import {
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getEntryPoint } from "../utils/entryPoint";
import { getPermissionId } from "../utils/mock/getPermissionId";
import { useAppId } from "./useAppId";
import { getSessionKey, useSessionPermission } from "./useSessionPermission";
import { useValidator } from "./useValidator";

export type UseSendUserOperationWithSessionArgs = {
  policies: Policy[] | undefined;
};

export type SendUserOperationWithSessionWriteArgs = Partial<{
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}>;

export type UseSendUserOperationWithSessionKey = {
  publicClient: PublicClient | undefined;
  validator: KernelValidator<EntryPoint> | null;
  appId: string | null;
  parameters: SendUserOperationWithSessionWriteArgs;
  policies: Policy[] | undefined;
  isExpired: boolean | undefined;
  enableSignature: `0x${string}` | undefined;
};

function mutationKey({ ...config }: UseSendUserOperationWithSessionKey) {
  const { validator, appId, parameters } = config;

  return [
    {
      entity: "sendUserOperationWithSession",
      validator,
      appId,
      parameters,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationWithSessionKey) {
  const {
    validator,
    appId,
    parameters,
    publicClient,
    policies,
    isExpired,
    enableSignature,
  } = config;
  const { to, value, data } = parameters;

  if (isExpired && !enableSignature) {
    throw new Error("Session is expired");
  }
  if (!validator) {
    throw new Error("Validator is required");
  }
  if (to === undefined || value === undefined || data === undefined) {
    throw new Error("UserOperation is required");
  }
  if (!appId) {
    throw new Error("API key is required");
  }
  if (!policies) {
    throw new Error("Policies are required");
  }

  const permissionId = getPermissionId(policies);
  const sessionKey = getSessionKey(permissionId);

  if (!sessionKey) {
    throw new Error("No Session Key found");
  }
  const sessionSigner = privateKeyToAccount(sessionKey);
  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(publicClient!, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: policies,
  });

  const permissionAccount = await createKernelAccount(publicClient!, {
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
      pluginEnableSignature: enableSignature,
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

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await permissionAccount.encodeCallData({
        to,
        value,
        data,
      }),
    },
  });

  return userOpHash;
}

export function useSendUserOperationWithSession({
  policies,
}: UseSendUserOperationWithSessionArgs) {
  const { validator, enableSignature } = useValidator();
  const { isExpired } = useSessionPermission({ policies });
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
      validator: validator,
      parameters: {},
      publicClient: client,
      policies,
      isExpired,
      enableSignature: enableSignature[getPermissionId(policies)],
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    if (!appId || !validator || !client || !policies || isExpired === undefined)
      return undefined;
    return (parameters: SendUserOperationWithSessionWriteArgs) => {
      mutate({
        parameters,
        validator,
        appId,
        publicClient: client,
        policies,
        isExpired,
        enableSignature: enableSignature[getPermissionId(policies)],
      });
    };
  }, [mutate, client, appId, validator, policies, isExpired, enableSignature]);

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
