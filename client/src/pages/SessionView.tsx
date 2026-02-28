import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useSession, useDecks, useUpdateSession } from "@/hooks/use-game";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Clock, PlayCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function SessionView() {
  const [, params] = useRoute("/session/:id");
  const [, setLocation] = useLocation();
  const sessionId = Number(params?.id);
  
  const { data: session, isLoading } = useSession(sessionId);
  const { data: allDecks } = useDecks();
  const updateSession = useUpdateSession();

  const [showWarning, setShowWarning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [notes, setNotes] = useState("");

  // Sync initial notes
  useEffect(() => {
    if (session && session.notes) setNotes(session.notes);
    if (session?.status === 'in_progress' || session?.status === 'completed') {
      setTimerStarted(true);
      // In a real app, calculate true time left via backend timestamps.
      // Here we simulate for the demo.
      setTimeLeft(session.timerMinutes * 60);
    }
  }, [session]);

  // Timer logic
  useEffect(() => {
    if (!timerStarted || timeLeft <= 0 || session?.status === 'completed') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          updateSession.mutate({ id: sessionId, status: 'completed' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStarted, timeLeft, session?.status, sessionId, updateSession]);

  // Auto-save notes debounce
  useEffect(() => {
    if (!session || notes === session.notes) return;
    const timeout = setTimeout(() => {
      updateSession.mutate({ id: sessionId, notes });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [notes, sessionId, session, updateSession]);

  if (isLoading || !session) return <MobileLayout><div className="animate-pulse flex justify-center mt-20">Загрузка...</div></MobileLayout>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setShowWarning(false);
    setTimerStarted(true);
    setTimeLeft(session.timerMinutes * 60);
    updateSession.mutate({ id: sessionId, status: 'in_progress' });
  };

  const isExpired = timerStarted && timeLeft <= 0;
  const canAccessCards = timerStarted && !isExpired;

  // Filter decks available for this session
  const sessionDecks = allDecks?.filter(d => session.deckIds.includes(d.id)) || [];

  return (
    <MobileLayout title={`Сессия ${session.number}`}>
      <div className="space-y-6">
        {/* Header & Timer */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-primary">{session.name}</h2>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-primary/30 text-xl font-mono text-primary">
            <Clock className="w-5 h-5" />
            {timerStarted ? formatTime(timeLeft) : `${session.timerMinutes}:00`}
          </div>

          {!timerStarted && (
            <Button 
              onClick={() => setShowWarning(true)}
              className="w-full mt-2 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Начать Сессию
            </Button>
          )}
          {isExpired && (
            <div className="text-destructive font-bold text-sm bg-destructive/10 px-4 py-2 rounded-lg">
              Время вышло. Доступ к картам закрыт.
            </div>
          )}
        </div>

        {/* Decks Grid */}
        <div className="space-y-4">
          <h3 className="font-display text-xl text-foreground ml-2">Колоды</h3>
          <div className="grid grid-cols-2 gap-4">
            {sessionDecks.map((deck) => (
              <motion.div
                key={deck.id}
                whileHover={canAccessCards ? { scale: 1.05 } : {}}
                whileTap={canAccessCards ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (canAccessCards) setLocation(`/session/${sessionId}/deck/${deck.id}`);
                }}
                className={`
                  aspect-[3/4] rounded-xl border relative overflow-hidden flex flex-col justify-end p-4 transition-all
                  ${canAccessCards ? 'cursor-pointer border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'cursor-not-allowed border-white/5 opacity-50 grayscale'}
                `}
                style={{
                  backgroundImage: `url(${deck.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 text-center">
                  <h4 className="font-bold text-white leading-tight">{deck.name}</h4>
                  <p className="text-xs text-white/70 mt-1">{deck.sphere}</p>
                </div>
                {!canAccessCards && timerStarted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-20">
                    <Lock className="w-8 h-8 text-white/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Session Notes (Always accessible) */}
        <div className="space-y-3 pt-4">
          <h3 className="font-display text-xl text-foreground ml-2">Заметки по сессии</h3>
          <Textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ваши инсайты, выводы и мысли по итогу сессии..."
            className="min-h-[200px] glass-panel border-primary/20 bg-background/50 text-base resize-none focus-visible:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground text-right">Сохраняется автоматически</p>
        </div>
      </div>

      {/* Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="w-[90vw] max-w-sm rounded-3xl glass-panel border-primary/30">
          <DialogTitle className="font-display text-2xl text-center text-primary glow-text">Внимание</DialogTitle>
          <DialogDescription className="text-center text-base py-4 text-foreground/80">
            Отведите себе достаточное время для работы. Вернуться к выбору карт после окончания сессии уже не получится.
          </DialogDescription>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowWarning(false)} className="flex-1 border-white/10">
              Отмена
            </Button>
            <Button onClick={startSession} className="flex-1 bg-primary text-primary-foreground">
              Я готов
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
