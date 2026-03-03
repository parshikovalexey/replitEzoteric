import { ReactNode } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useGoals } from "@/hooks/use-game";
import { useLocation } from "wouter";
import { FileText } from "lucide-react";
import { Button } from "./ui/button";

export function MobileLayout({ children, title, action }: { children: ReactNode; title?: string; action?: ReactNode }) {
  const { data: goals } = useGoals();
  const [location, setLocation] = useLocation();
  const currentGoal = goals?.[goals.length - 1];

  return (
    <div className="min-h-screen w-full flex justify-center bg-black/50">
      <div className="w-full max-w-md bg-background min-h-screen shadow-2xl relative overflow-hidden flex flex-col h-screen">
        <div className="stars-bg"></div>
        
        {/* Header */}
        <header className="px-6 py-4 flex flex-col z-10 bg-background/40 backdrop-blur-lg border-b border-white/5 sticky top-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {title && <h1 className="font-display text-xl font-bold text-primary glow-text">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/report")}
                className="text-primary/60 hover:text-primary hover:bg-white/5"
                title="Отчет"
              >
                <FileText className="w-5 h-5" />
              </Button>
              {action}
              <ThemeSwitcher />
            </div>
          </div>
          {currentGoal && (
            <div className="mt-2 text-[10px] text-primary/80 font-medium italic border-t border-white/5 pt-2 text-center leading-tight">
              {currentGoal.question}
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-0 p-6 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
