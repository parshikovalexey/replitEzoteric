import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useSession, useDecks, useUpdateSession, useNotesBySession, useCardsByDeck } from "@/hooks/use-game";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Clock, PlayCircle, Lock, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";

export default function SessionView() {
  const [, params] = useRoute("/session/:id");
  const [, setLocation] = useLocation();
  const sessionId = Number(params?.id);
  
  const { data: session, isLoading } = useSession(sessionId);
  const { data: allDecks } = useDecks();
  const { data: notes } = useNotesBySession(sessionId);
  const updateSession = useUpdateSession();

  const [showWarning, setShowWarning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [notesText, setNotes] = useState("");

  // Sync initial notes and timer
  useEffect(() => {
    if (session && session.notes) setNotes(session.notes);
    if (session?.status === 'in_progress' || session?.status === 'completed') {
      setTimerStarted(true);
      if (session.startTime) {
        const start = new Date(session.startTime).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - start) / 1000);
        const total = (session.timerMinutes || 30) * 60;
        setTimeLeft(Math.max(0, total - elapsed));
      } else {
        setTimeLeft((session.timerMinutes || 30) * 60);
      }
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
    if (!session || notesText === session.notes) return;
    const timeout = setTimeout(() => {
      updateSession.mutate({ id: sessionId, notes: notesText });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [notesText, sessionId, session, updateSession]);

  if (isLoading || !session) return <MobileLayout><div className="animate-pulse flex justify-center mt-20">Загрузка...</div></MobileLayout>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setShowWarning(false);
    setTimerStarted(true);
    const totalSeconds = (session.timerMinutes || 30) * 60;
    setTimeLeft(totalSeconds);
    updateSession.mutate({ 
      id: sessionId, 
      status: 'in_progress',
      startTime: new Date().toISOString()
    });
  };

  const isExpired = timerStarted && timeLeft <= 0;
  const canAccessCards = timerStarted && !isExpired;

  // Filter decks available for this session
  const sessionDecks = allDecks?.filter(d => session.deckIds.includes(d.id)) || [];

  const finishSession = () => {
    updateSession.mutate({ id: sessionId, status: 'completed' }, {
      onSuccess: () => setLocation("/training")
    });
  };

  return (
    <MobileLayout 
      title={session.name}
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation("/training")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      }
    >
      <div className="space-y-6 pb-20">
        {/* Header & Timer */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-primary">{session.name}</h2>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-primary/30 text-xl font-mono text-primary">
            <Clock className="w-5 h-5" />
            {timerStarted ? formatTime(timeLeft) : `${session.timerMinutes}:00`}
          </div>

          <div className="flex flex-col w-full gap-2">
            {!timerStarted && (
              <Button 
                onClick={() => setShowWarning(true)}
                className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Начать Сессию
              </Button>
            )}
            
            {timerStarted && session.status !== 'completed' && (
              <Button 
                onClick={finishSession}
                variant="outline"
                className="w-full py-4 border-primary/30 text-primary hover:bg-primary/10"
              >
                Завершить сессию
              </Button>
            )}
          </div>
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
              <SessionDeckCard 
                key={deck.id}
                deck={deck}
                sessionId={sessionId}
                canAccess={canAccessCards}
                isCompleted={session.status === 'completed'}
                onClick={() => setLocation(`/session/${sessionId}/deck/${deck.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Session Notes */}
        <div className="space-y-3 pt-4">
          <h3 className="font-display text-xl text-foreground ml-2">Заметки по сессии</h3>
          <Textarea 
            value={notesText}
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

function SessionDeckCard({ deck, sessionId, canAccess, isCompleted, onClick }: any) {
  const { data: cards } = useCardsByDeck(deck.id);
  const { data: notes } = useNotesBySession(sessionId);
  
  const chosenCard = useMemo(() => {
    if (!cards || !notes) return null;
    const deckCardIds = cards.map(c => c.id);
    const note = notes.find(n => n.parentId === null && deckCardIds.includes(n.cardId));
    if (!note) return null;
    return cards.find(c => c.id === note.cardId);
  }, [cards, notes]);

  return (
    <motion.div
      whileHover={canAccess ? { scale: 1.05 } : {}}
      whileTap={canAccess ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`
        aspect-[3/4] rounded-xl border relative overflow-hidden flex flex-col justify-end p-4 transition-all
        ${canAccess ? 'cursor-pointer border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'cursor-not-allowed border-white/5 opacity-50 grayscale'}
        ${chosenCard ? 'border-primary shadow-[0_0_20px_var(--primary)]' : ''}
      `}
      style={{
        backgroundImage: `url(${deck.coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      {chosenCard && (
        <div className="absolute top-2 right-2 z-20">
          <CheckCircle2 className="w-5 h-5 text-primary fill-background" />
        </div>
      )}

      <div className="relative z-10 text-center">
        {chosenCard ? (
          <>
            <h4 className="font-bold text-primary leading-tight text-sm uppercase">Выбрано:</h4>
            <p className="text-xs text-white font-bold mt-1 line-clamp-2">{chosenCard.name}</p>
          </>
        ) : (
          <>
            <h4 className="font-bold text-white leading-tight">{deck.name}</h4>
            <p className="text-xs text-white/70 mt-1">{deck.sphere}</p>
          </>
        )}
      </div>
      
      {!canAccess && !isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-20">
          <Lock className="w-8 h-8 text-white/50" />
        </div>
      )}
    </motion.div>
  );
}
