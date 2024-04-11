import { Modal, SegmentedControl, Text } from "@mantine/core";
import { useState } from "react";
import {
  usePaymasterModal,
  type PaymasterSetting,
  type PaymasterType,
} from "./PaymasterProvider";

export interface PaymasterModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaymasterSwitch({ setting }: { setting: PaymasterSetting }) {
  const { updatePaymasterSetting } = usePaymasterModal();

  const [value, setValue] = useState<PaymasterType>(setting.type);
  const sessionId = setting.sessionId;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Text style={{ marginBottom: sessionId ? "10px" : "0" }}>
          {sessionId ? `Permission ID: ${sessionId}` : "Mint"}
        </Text>
        <div
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <SegmentedControl
            value={value}
            onChange={(v: string) => {
              updatePaymasterSetting({
                sessionId: sessionId,
                type: v as PaymasterType,
              });
              setValue(v as PaymasterType);
            }}
            data={[
              { label: "NO", value: "NO" },
              { label: "SPONSOR", value: "SPONSOR" },
              { label: "ERC20", value: "ERC20" },
            ]}
          />
        </div>
      </div>
    </>
  );
}

export function PaymasterModal({ onClose, open }: PaymasterModalProps) {
  const { paymasterSetting } = usePaymasterModal();
  const titleId = "Paymaster";

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      title={titleId}
    >
      {paymasterSetting.map((setting, index) => (
        <PaymasterSwitch key={index} setting={setting} />
      ))}
    </Modal>
  );
}
