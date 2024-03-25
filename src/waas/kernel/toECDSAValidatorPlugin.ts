import { signMessage } from "@wagmi/core";
import type { KernelValidator } from "@zerodev/sdk";
import { KERNEL_ADDRESSES } from "@zerodev/sdk";
import type { TypedData } from "abitype";
import { getUserOperationHash, type UserOperation } from "permissionless";
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts";
import {
  type Address,
  type Chain,
  type Client,
  type Hex,
  type JsonRpcAccount,
  type Transport,
  type TypedDataDefinition,
} from "viem";
import { toAccount } from "viem/accounts";
import { getChainId, signTypedData } from "viem/actions";
import { type Config } from "wagmi";

const ECDSA_VALIDATOR_ADDRESS = "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390";
type SmartAccountSigner<TAddress extends Address = Address> = Omit<
  JsonRpcAccount<TAddress>,
  "signTransaction"
>;

export async function signerToEcdsaValidator<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAddress extends Address = Address
>(
  client: Client<TTransport, TChain, undefined>,
  {
    config,
    signer,
    entryPoint = KERNEL_ADDRESSES.ENTRYPOINT_V0_6,
    validatorAddress = ECDSA_VALIDATOR_ADDRESS,
  }: {
    config: Config;
    signer: SmartAccountSigner<TAddress>;
    entryPoint?: Address;
    validatorAddress?: Address;
  }
): Promise<KernelValidator<"ECDSAValidator">> {
  // Get the private key related account
  const viemSigner: JsonRpcAccount = {
    ...signer,
    signTransaction: (_: any, __: any) => {
      throw new SignTransactionNotSupportedBySmartAccount();
    },
  } as JsonRpcAccount;

  // Fetch chain id
  const chainId = await getChainId(client);

  // Build the EOA Signer
  const account = toAccount({
    address: viemSigner.address,
    async signMessage({ message }) {
      return signMessage(config, { account: viemSigner, message });
    },
    async signTransaction(_, __) {
      throw new SignTransactionNotSupportedBySmartAccount();
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      return signTypedData<TTypedData, TPrimaryType, TChain, undefined>(
        client,
        {
          account: viemSigner,
          ...typedData,
        }
      );
    },
  });
  return {
    ...account,
    address: validatorAddress,
    source: "ECDSAValidator",

    async getEnableData() {
      return viemSigner.address;
    },
    async getNonceKey() {
      return 0n;
    },
    // Sign a user operation
    async signUserOperation(userOperation: UserOperation) {
      const hash = getUserOperationHash({
        userOperation: {
          ...userOperation,
          signature: "0x",
        },
        entryPoint: entryPoint,
        chainId: chainId,
      });
      const signature = await signMessage(config, {
        account: viemSigner,
        message: { raw: hash },
      });
      return signature;
    },

    // Get simple dummy signature
    async getDummySignature() {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
    },

    async isEnabled(
      _kernelAccountAddress: Address,
      _selector: Hex
    ): Promise<boolean> {
      return false;
    },
  };
}
