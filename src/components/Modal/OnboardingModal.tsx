import { useSwapBalance, useSwapData } from "@/hooks";
import { Button, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useKernelClient } from "@zerodev/waas";
import { useEffect, useState } from "react";
import { BaseError, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import {
  OnboardingInput,
  OnboardingPreview,
  type OnboardingParams,
} from "./Onboarding";

export interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  onClose,
  open,
}: OnboardingModalProps) {
  const titleId = "Onboarding";
  const { address: smartAccountAddress } = useKernelClient();
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switchIsPending } = useSwitchChain();
  const { sendTransactionAsync, isPending: txIsPending } = useSendTransaction();
  const [step, setStep] = useState(0);
  const [params, setParams] = useState<OnboardingParams>({
    srcChain: null,
    dstChain: null,
    srcToken: null,
    dstToken: null,
    amount: undefined,
  });

  const {
    data: balanceIn,
    isLoading: isLoadingIn,
    error: balanceInError,
  } = useSwapBalance({
    chainId: params.srcChain,
    tokenAddress: params.srcToken,
  });
  const { data: balanceOut, isLoading: isLoadingOut } = useSwapBalance({
    chainId: params.dstChain,
    tokenAddress: params.dstToken,
  });
  const {
    data: swapData,
    write,
    error,
    isPending,
  } = useSwapData({
    onSuccess: () => setStep(1),
    onError: (error: any) => {
      const reason = error.errors
        ?.flatMap((e: any) => e.failed.map((f: any) => f.code))
        .slice(0, 2)
        .join(", ");

      notifications.show({
        color: "red",
        title: error.message,
        message: reason,
      });
    },
  });

  useEffect(() => {
    if (!open) {
      setParams({
        srcChain: null,
        dstChain: null,
        srcToken: null,
        dstToken: null,
        amount: undefined,
      });
      setStep(0);
    }
  }, [open]);

  const insufficientError = () => {
    if (!balanceIn || !params.amount) return undefined;
    const amountBN = parseUnits(params.amount, balanceIn.decimals);
    if (amountBN <= 0n) return "Must be greater than 0";
    return balanceIn.value < amountBN ? "Insufficient Balance" : undefined;
  };

  const onClickOnboarding = async () => {
    if (!params.srcChain || !swapData) return;
    try {
      if (chainId !== Number(params.srcChain)) {
        await switchChainAsync({
          chainId: Number(params.srcChain),
        });
      }
      const hash = await sendTransactionAsync({
        to: swapData.targetAddress,
        value: BigInt(swapData.value),
        data: swapData.callData,
      });
      onClose();
      notifications.show({
        color: "green",
        title: "Onboarding success",
        message: `Tx hash ${hash}`,
      });
    } catch (err: any) {
      let message;
      if (err instanceof BaseError) {
        const baseError = err as BaseError;
        message = baseError.shortMessage;
      }
      notifications.show({
        color: "red",
        message: message ?? "Unknown Error occurred",
      });
    }
  };

  const isGetSwapDataReady =
    !!params.srcChain &&
    !!params.dstChain &&
    !!params.srcToken &&
    !!params.dstToken &&
    !!params.amount &&
    !!balanceIn &&
    !insufficientError();

  useEffect(() => {
    if (open) {
      setStep(0);
    }
  }, [open]);

  return (
    <Modal opened={open} onClose={onClose} title={titleId} centered size="lg">
      {step === 0 && <OnboardingInput params={params} setParams={setParams} />}
      {step === 1 && (
        <OnboardingPreview
          params={params}
          amountOut={formatUnits(
            BigInt(swapData?.amountOut ?? 0n),
            balanceOut?.decimals ?? 18
          )}
        />
      )}
      <div className="flex justify-center mt-6">
        {step === 0 && (
          <Button
            disabled={!isGetSwapDataReady}
            loading={isLoadingIn || isLoadingOut || isPending}
            onClick={() =>
              write({
                from: address,
                to: smartAccountAddress,
                tokenIn: params.srcToken,
                tokenOut: params.dstToken,
                srcChainId: Number(params.srcChain?.toString()),
                dstChainId: Number(params.dstChain?.toString()),
                amountIn: parseUnits(
                  params.amount as string,
                  balanceIn?.decimals
                ).toString(),
              })
            }
          >
            Get Output Amount
          </Button>
        )}
        {step === 1 && (
          <div className="mb-2 flex justify-center gap-2">
            <Button
              disabled={switchIsPending || txIsPending}
              onClick={() => setStep(0)}
            >
              Back
            </Button>
            <Button
              loading={switchIsPending || txIsPending}
              disabled={!params.srcChain || !swapData}
              onClick={() => {
                onClickOnboarding();
              }}
            >
              Onboard
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
