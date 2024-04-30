import {
  Center,
  Loader,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";

const LoadingOverlay = ({ isLoading }: { isLoading: boolean }) => {
  const colorSheme = useMantineColorScheme();
  const theme = useMantineTheme();

  if (!isLoading) return null;

  return (
    <Center
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor:
          colorSheme.colorScheme === "dark"
            ? theme.colors.dark[9]
            : theme.colors.gray[7],
        zIndex: 999,
        opacity: 0.5,
      }}
    >
      <Loader size="xl" variant="bars" />
    </Center>
  );
};

export default LoadingOverlay;
