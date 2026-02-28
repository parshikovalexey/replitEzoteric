import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Printer } from "lucide-react";
import { useLocation } from "wouter";

export function CompletionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-panel border-primary/30 text-center space-y-6 pt-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_var(--primary)]">
          <Sparkles className="w-10 h-10 text-primary-foreground animate-pulse" />
        </div>
        
        <DialogTitle className="font-display text-3xl text-primary glow-text mt-4">
          Тренинг завершён!
        </DialogTitle>
        
        <DialogDescription className="text-base text-foreground/80">
          Вы прошли весь путь трансформации. Теперь вы можете сохранить свои осознания и инсайты.
          <br /><br />
          <span className="text-sm text-muted-foreground">
            Для загрузки в формате PDF, выберите в меню печати браузера "Печать в PDF".
          </span>
        </DialogDescription>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={() => setLocation("/report")}
            className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            <Printer className="w-5 h-5 mr-2" />
            Перейти к отчету
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full py-6 border-white/10 hover:bg-white/5">
            Вернуться
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
