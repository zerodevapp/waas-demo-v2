import { Button, Modal } from "@mantine/core";
import { type Policy } from "@zerodev/permissions";
import { ParamOperator } from "@zerodev/session-key";
import {
  useCreateBasicSession,
  useCreateSession,
  useKernelClient,
} from "@zerodev/waas";
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless";
import { parseAbi } from "viem";

export interface SessionModalProps {
  open: boolean;
  onClose: () => void;
  policies: Policy[];
}
interface CreateBasicSessionModalProps
  extends Omit<SessionModalProps, "policies"> {}

function CreateSessionModal({ onClose, open, policies }: SessionModalProps) {
  const titleId = "Session";
  const { write, isPending } = useCreateSession({
    mutation: {
      onSuccess: () => {
        onClose();
      },
    },
  });

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
          loading={isPending}
          disabled={!write}
          onClick={() => {
            write({
              policies,
            });
          }}
        >
          Approve
        </Button>
      </div>
    </Modal>
  );
}

function CreateBasicSessionModal({
  onClose,
  open,
}: CreateBasicSessionModalProps) {
  const titleId = "Session";
  const { address } = useKernelClient();
  const { write, data, error, isPending } = useCreateBasicSession({
    mutation: {
      onSuccess: () => {
        onClose();
      },
    },
  });

  const contractAddress = "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B";
  const contractABI = parseAbi([
    "function mint(address _to, uint256 amount) public",
  ]);

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
          loading={isPending}
          disabled={!write || !address}
          onClick={() => {
            write?.({
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
                      value: address,
                    },
                    {
                      operator: ParamOperator.EQUAL,
                      value: 1,
                    },
                  ],
                },
              ],
            });
          }}
        >
          Approve
        </Button>
      </div>
    </Modal>
  );
}

export default function SessionModal({
  onClose,
  open,
  policies,
}: SessionModalProps) {
  const { entryPoint } = useKernelClient();

  if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
    return <CreateBasicSessionModal onClose={onClose} open={open} />;
  } else {
    return (
      <CreateSessionModal onClose={onClose} open={open} policies={policies} />
    );
  }
}
