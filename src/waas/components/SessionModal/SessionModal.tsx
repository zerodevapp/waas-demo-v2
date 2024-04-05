import { useCreateSession, useKernelAccount } from "@/waas";
import { Button, Loader, Modal } from "@mantine/core";
import { type Policy } from "@zerodev/permissions";
import { ParamOperator } from "@zerodev/session-key";
import { useEffect, useState } from "react";
import { parseAbi } from "viem";

export interface SessionModalProps {
  open: boolean;
  onClose: () => void;
  policies: Policy[];
}

export default function SessionModal({
  onClose,
  open,
  policies,
}: SessionModalProps) {
  const titleId = "Session";
  const [isLoading, setIsLoading] = useState(false);
  const { kernelAccount } = useKernelAccount();
  const { write, data, error } = useCreateSession();
  const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const contractABI = parseAbi(["function mint(address _to) public"]);

  useEffect(() => {
    if (data) onClose();
    setIsLoading(false);
  }, [data, error, onClose]);

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      title={titleId}
    >
      <div className="flex flex-col justify-center items-center">
        <h1>Permission Approval</h1>
        <Button
          variant="outline"
          disabled={isLoading || !write || !kernelAccount}
          onClick={() => {
            setIsLoading(true);
            write?.({
              policies,
              permissions: [
                {
                  target: contractAddress,
                  // Maximum value that can be transferred.  In this case we
                  // set it to zero so that no value transfer is possible.
                  valueLimit: 0n,
                  // Contract abi
                  abi: contractABI,
                  // Function name
                  functionName: "mint",
                  // An array of conditions, each corresponding to an argument for
                  // the function.
                  args: [
                    {
                      // In this case, we are saying that the session key can only mint
                      // NFTs to the account itself
                      operator: ParamOperator.EQUAL,
                      value: kernelAccount?.address,
                    },
                  ],
                },
              ],
            });
          }}
        >
          Approve
        </Button>
        {isLoading && <Loader />}
      </div>
    </Modal>
  );
}
