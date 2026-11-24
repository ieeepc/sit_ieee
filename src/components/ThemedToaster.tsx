"use client";

import { Toaster } from "sonner";
import { useTheme } from "./ThemeToggle";

export default function ThemedToaster() {
  const theme = useTheme();
  return <Toaster theme={theme} position="top-center" richColors />;
}
