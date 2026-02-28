import { useState, useEffect } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Theme = "theme-space" | "theme-mystical" | "theme-tarot";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("theme-space");

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as Theme;
    if (saved) {
      setTheme(saved);
      document.body.className = saved;
    } else {
      document.body.className = "theme-space";
    }
  }, []);

  const cycleTheme = () => {
    const themes: Theme[] = ["theme-space", "theme-mystical", "theme-tarot"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    setTheme(nextTheme);
    document.body.className = nextTheme;
    localStorage.setItem("app-theme", nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "theme-space": return <Moon className="w-5 h-5" />;
      case "theme-mystical": return <Sparkles className="w-5 h-5" />;
      case "theme-tarot": return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={cycleTheme}
      className="rounded-full bg-background/50 backdrop-blur-md border-primary/20 hover:bg-primary/20 transition-all duration-300"
      title="Сменить тему"
    >
      {getThemeIcon()}
    </Button>
  );
}
