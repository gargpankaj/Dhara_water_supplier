import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";

export function AppProviders({ children }: PropsWithChildren) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("aquaflow-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("aquaflow-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBridge isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
        {children}
        <Toaster richColors position="top-right" theme={isDarkMode ? "dark" : "light"} />
      </ThemeBridge>
    </QueryClientProvider>
  );
}

type ThemeBridgeProps = PropsWithChildren<{
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}>;

function ThemeBridge({ children, isDarkMode, setIsDarkMode }: ThemeBridgeProps) {
  (window as Window & { __aquaflowTheme?: ThemeBridgeProps }).__aquaflowTheme = {
    children: null,
    isDarkMode,
    setIsDarkMode,
  };
  return children;
}

