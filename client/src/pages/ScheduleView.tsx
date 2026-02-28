import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSessions, useGoals } from "@/hooks/use-game";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, Play, CheckCircle2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { CompletionModal } from "@/components/CompletionModal";

export default function ScheduleView() {
  const [, setLocation] = useLocation();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const [showCompletion, setShowCompletion] = useState(false);

  // Redirect to goal creation if no goal exists
  useEffect(() => {
    if (!goalsLoading && (!goals || goals.length === 0)) {
      setLocation("/");
    }
  }, [goals, goalsLoading, setLocation]);

  if (sessionsLoading || goalsLoading) {
    return (
      <MobileLayout title="Расписание">
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  // Assuming backend returns sessions. If not, fallback to empty array.
  const sessionList = sessions || [];
  const completedCount = sessionList.filter(s => s.status === 'completed').length;
  const totalCount = sessionList.length || 7; // Mock 7 total if empty
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <MobileLayout 
      title="Путь Трансформации"
      action={
        isAllCompleted ? (
          <Button size="icon" variant="ghost" onClick={() => setShowCompletion(true)} className="text-primary">
            <FileText className="w-5 h-5" />
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-8">
        {/* Progress Tracker */}
        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-display font-bold text-lg text-foreground">Ваш прогресс</h3>
            <span className="text-primary font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-background/50" indicatorClassName="bg-primary shadow-[0_0_10px_var(--primary)]" />
          <p className="text-xs text-muted-foreground text-right mt-1">
            Завершено {completedCount} из {totalCount} дней
          </p>
          {isAllCompleted && (
            <Button 
              onClick={() => setShowCompletion(true)}
              className="w-full mt-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ознакомиться с отчетом
            </Button>
          )}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessionList.map((session, index) => {
            const isLocked = session.status === 'locked';
            const isCompleted = session.status === 'completed';
            const isAvailable = session.status === 'available' || session.status === 'in_progress';

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (!isLocked) setLocation(`/session/${session.id}`);
                }}
                className={`
                  p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
                  ${isLocked ? 'bg-background/40 border-white/5 opacity-60 cursor-not-allowed' : 'glass-panel hover:scale-[1.02] cursor-pointer hover:border-primary/50'}
                  ${isAvailable ? 'border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : ''}
                `}
              >
                {isAvailable && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                )}
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-secondary text-secondary-foreground">
                        День {session.number}
                      </span>
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <h4 className={`font-display text-lg font-bold ${isAvailable ? 'text-primary' : 'text-foreground'}`}>
                      {session.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {session.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-background/50 border border-white/10">
                    {isLocked ? <Lock className="w-5 h-5 text-muted-foreground" /> : 
                     isCompleted ? <CheckCircle2 className="w-6 h-6 text-primary" /> : 
                     <Play className="w-5 h-5 text-primary ml-1" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Fallback for empty state (mock data missing) */}
        {sessionList.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            Сессии не найдены. Убедитесь, что база данных инициализирована.
          </div>
        )}
      </div>

      <CompletionModal isOpen={showCompletion} onClose={() => setShowCompletion(false)} />
    </MobileLayout>
  );
}
