import { useModal } from "@/hooks";
import { Button } from "@mantine/core";

export function OnboardingButton() {
  const { openOnboardingModal } = useModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        openOnboardingModal?.();
      }}
    >
      Onboarding
    </Button>
  );
}
