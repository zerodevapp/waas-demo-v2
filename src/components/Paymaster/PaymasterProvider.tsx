import { useSessions } from "@/waas";
import { useModalStateValue } from "@/waas/components/ZeroDevProvider/ModalContext";
import { PaymasterERC20, PaymasterSPONSOR } from "@/waas/types";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PaymasterModal } from "./PaymasterModal";

export type PaymasterType = "NO" | "SPONSOR" | "ERC20";
export type PaymasterSetting = {
  sessionId?: string;
  type: PaymasterType;
};

interface PaymasterModalContextValue {
  paymasterModalOpen: boolean;
  openPaymasterModal?: () => void;
  paymasterSetting: PaymasterSetting[];
  updatePaymasterSetting: (setting: PaymasterSetting) => void;
}

export const PaymasterModalContext = createContext<PaymasterModalContextValue>({
  paymasterModalOpen: false,
  paymasterSetting: [],
  updatePaymasterSetting: () => {},
});

interface PaymasterModalProviderProps {
  children: ReactNode;
}

export function PaymasterProvider({ children }: PaymasterModalProviderProps) {
  const [paymasterSetting, setPaymasterSetting] = useState<PaymasterSetting[]>([
    { type: "NO" as PaymasterType },
  ]);
  const sessions = useSessions();

  const {
    closeModal: closePaymasterModal,
    isModalOpen: paymasterModalOpen,
    openModal: openPaymasterModal,
  } = useModalStateValue();

  const openPaymasterModalAction = useCallback(() => {
    openPaymasterModal();
  }, [openPaymasterModal]);

  const updatePaymasterSetting = useCallback(
    (setting: PaymasterSetting) => {
      setPaymasterSetting((prev) => {
        const index = prev.findIndex(
          (item) => item.sessionId === setting.sessionId
        );
        if (index === -1) {
          return prev.concat(setting);
        }
        prev[index] = setting;
        return prev;
      });
    },
    [setPaymasterSetting]
  );

  useEffect(() => {
    const updatePaymaster = () => {
      if (!sessions || Object.keys(sessions).length === 0) return;
      const array = Array.from([{ type: "NO" as PaymasterType }]).concat(
        Object.keys(sessions).map((sessionId) => ({
          sessionId: sessionId,
          type: "NO" as PaymasterType,
        }))
      );
      setPaymasterSetting(array);
    };

    updatePaymaster();
  }, [sessions]);

  return (
    <PaymasterModalContext.Provider
      value={useMemo(
        () => ({
          paymasterModalOpen,
          openPaymasterModal: openPaymasterModalAction,
          paymasterSetting,
          updatePaymasterSetting,
        }),
        [
          paymasterModalOpen,
          openPaymasterModalAction,
          paymasterSetting,
          updatePaymasterSetting,
        ]
      )}
    >
      {children}
      <PaymasterModal onClose={closePaymasterModal} open={paymasterModalOpen} />
    </PaymasterModalContext.Provider>
  );
}

export function usePaymasterModal() {
  const {
    paymasterModalOpen,
    openPaymasterModal,
    paymasterSetting,
    updatePaymasterSetting,
  } = useContext(PaymasterModalContext);

  return {
    paymasterModalOpen,
    openPaymasterModal,
    paymasterSetting,
    updatePaymasterSetting,
  };
}

export function usePaymasterConfig({
  sessionId,
}: {
  sessionId?: string;
} = {}) {
  const { paymasterSetting } = usePaymasterModal();

  const setting = paymasterSetting.find(
    (setting) => setting.sessionId === sessionId
  );
  const paymasterConfig = useMemo(() => {
    if (!setting || setting.type === "NO") {
      return undefined;
    } else if (setting.type === "SPONSOR") {
      return {
        type: "SPONSOR",
      } as PaymasterSPONSOR;
    } else if (setting.type === "ERC20") {
      return {
        type: "ERC20",
        gasToken: "6TEST", // Sepolia 6TEST
      } as PaymasterERC20;
    }
  }, [setting]);

  return {
    paymasterConfig,
  };
}
