import { useEnableSession, useSessionPermission, useValidator } from "@/waas";
import { Button, Loader } from "@mantine/core";
import { useEffect, useState } from "react";

export default function PermissionApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const { setKernelAccount } = useValidator();
  const { permissions } = useSessionPermission();
  const { write, data } = useEnableSession();

  useEffect(() => {
    const setAccount = () => {
      if (data) {
        setKernelAccount(data);
      }
    };
    setAccount();
  }, [data]);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1>Permission Approval</h1>
      <Button
        variant="outline"
        disabled={!permissions || isLoading}
        onClick={() => {
          setIsLoading(true);
          write(permissions);
        }}
      >
        Approve
      </Button>
      {!permissions && <p>Fetching permissions...</p>}
      {isLoading && <Loader />}
    </div>
  );
}
