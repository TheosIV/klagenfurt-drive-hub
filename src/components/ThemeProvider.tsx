import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

// Wraps the app with next-themes and declares our custom themes.
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      themes={["light", "night"]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
