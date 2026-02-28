import { useState, useMemo, useEffect } from "react";
  import { useRoute, useLocation } from "wouter";
  import { useDeck, useCardsByDeck, useNotesBySession, useSaveNote, useDecks, useSession, useGoals } from "@/hooks/use-game";
  import { MobileLayout } from "@/components/MobileLayout";
  import { Button } from "@/components/ui/button";
  import { ArrowLeft, ChevronRight, Check, X } from "lucide-react";
  import { motion, AnimatePresence } from "framer-motion";
  import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
  import { Textarea } from "@/components/ui/textarea";

  function CardFace({ card, isChosen }: { card: any, isChosen?: boolean }) {
    return (
      <div className={`w-full h-full relative bg-card border-2 shadow-xl rounded-xl p-4 flex flex-col justify-center items-center text-center overflow-hidden ${isChosen ? 'border-primary shadow-[0_0_15px_var(--primary)]' : 'border-primary/50'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <span className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">{card.actionType}</span>
        <h5 className="font-display font-bold text-2xl leading-tight text-foreground">#{card.id}</h5>
        <p className="font-display font-medium text-xs mt-2 text-foreground/80">{card.name}</p>
        {isChosen && <div className="mt-2 bg-primary/20 px-2 py-0.5 rounded text-[10px] text-primary font-bold tracking-widest">ВЫБРАНО</div>}
      </div>
    );
  }

  
  function NestedDeckItem({ deckId, parentCardId, sessionId, slotIndex, onClick }: any) {
    const { data: allDecks } = useDecks();
    const { data: notes } = useNotesBySession(sessionId);
    const { data: deckCards } = useCardsByDeck(deckId);
    const deck = allDecks?.find(d => d.id === deckId);
    
    const chosenCard = useMemo(() => {
      if (!notes || !deckCards) return null;
      const cardIds = deckCards.map(c => c.id);
      const note = notes.find(n => n.parentId === parentCardId && n.slotIndex === slotIndex && cardIds.includes(n.cardId));
      if (!note) return null;
      return deckCards.find(c => c.id === note.cardId);
    }, [notes, deckCards, parentCardId]);

    return (
      <Button 
        variant="outline" 
        className={`shrink-0 h-24 w-16 p-0 border-primary/50 bg-card hover:bg-primary/20 relative overflow-hidden ${chosenCard ? 'border-primary/50' : ''}`}
        onClick={onClick}
      >
        {chosenCard ? (
          <div className="w-full h-full scale-50 origin-center pointer-events-none">
             <CardFace card={chosenCard} isChosen={false} />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10">
              <span className="text-xs font-bold font-mono text-primary">N</span>
            </div>
            {deck?.coverImage && (
              <img src={deck.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
            )}
          </>
        )}
      </Button>
    );
  }


  function CardNoteDetail({ 
    card, sessionId, parentId = null, onClose 
  }: { 
    card: any, sessionId: number, parentId?: number | null, onClose: () => void 
  }) {
    const [, setLocation] = useLocation();
    const { data: notes } = useNotesBySession(sessionId);
    const saveNote = useSaveNote();
    
    const existingNote = notes?.find(n => n.cardId === card.id && n.parentId === parentId && n.slotIndex === (slotIndex ?? null));
    const [content, setContent] = useState(existingNote?.content || "");
    const [activeSlot, setActiveSlot] = useState<{deckId: number, index: number} | null>(null);

    useEffect(() => {
      if (existingNote && !content) {
        setContent(existingNote.content);
      }
    }, [existingNote, content]);

    const hasNested = card.requiredDecks && card.requiredDecks.length > 0;

    // Recursive function to aggregate child notes
    const getChildNotes = (parentCardId: number, currentNotes: any[]): string[] => {
      const children = currentNotes.filter(n => n.parentId === parentCardId);
      let results: string[] = [];
      for (const child of children) {
        // Add child's own note if not empty
        if (child.content && child.content.trim()) {
          results.push(child.content.trim());
        }
        // Recursively add grandchildren notes
        results = [...results, ...getChildNotes(child.cardId, currentNotes)];
      }
      return results;
    };

    const aggregatedChildNotes = useMemo(() => {
      if (!notes) return "";
      const childNotesList = getChildNotes(card.id, notes);
      return childNotesList.join('\n\n');
    }, [notes, card.id]);

    const handleSave = () => {
      const isChanged = content !== existingNote?.content;
      if (!isChanged) {
        if (parentId === null) setLocation(`/session/${sessionId}`);
        else onClose();
        return;
      }

      saveNote.mutate({ sessionId, cardId: card.id, content, parentId, slotIndex }, {
        onSuccess: () => {
          if (parentId === null) setLocation(`/session/${sessionId}`);
          else onClose();
        }
      });
    };

    useEffect(() => {
      return () => {
        if (content !== existingNote?.content && (content.trim() || existingNote)) {
          saveNote.mutate({ sessionId, cardId: card.id, content, parentId, slotIndex });
        }
      };
    }, [content, existingNote, sessionId, card.id, parentId]);

    if (activeSlot) {
      return (
        <NestedDeckNav 
          deckId={activeNestedDeck} 
          sessionId={sessionId} 
          parentCardId={card.id} 
          onBack={() => setActiveNestedDeck(null)} 
        />
      );
    }

    return (
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-end">
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <div className="flex flex-col gap-6 items-center">
          <div className="shrink-0 w-full flex justify-center">
            <div className="w-48 aspect-[2/3] relative">
              <CardFace card={card} isChosen={true} />
            </div>
          </div>
          {card.tips && (
            <div className="w-full space-y-2">
              <h4 className="text-sm font-bold text-[#d4af37] uppercase text-center">Подсказки и толкования</h4>
              <p className="text-sm text-foreground/80 leading-relaxed bg-[#d4af37]/5 p-3 rounded-lg border border-[#d4af37]/20 italic text-center">
                {card.tips}
              </p>
            </div>
          )}
        </div>

        {aggregatedChildNotes && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
             <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Заметки из вложенных карт</h4>
             <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
               {aggregatedChildNotes}
             </div>
          </div>
        )}

        {hasNested && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-sm font-semibold text-primary">Требуются дополнительные карты:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {card.requiredDecks.map((reqDeckId: number, idx: number) => (
                <NestedDeckItem 
                  key={`req-${reqDeckId}-${idx}`}
                  deckId={reqDeckId}
                  parentCardId={card.id}
                  sessionId={sessionId}
                  slotIndex={idx} onClick={() => setActiveSlot({deckId: reqDeckId, index: idx})}
                />
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col gap-2 pt-2 border-t border-white/10">
          <label className="text-sm font-semibold text-foreground">Заметка по карте</label>
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[100px] resize-none bg-background/50 border-white/10 focus-visible:ring-primary/50"
            placeholder="Опишите свои мысли..."
          />
          <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Сохранить заметку
          </Button>
        </div>
      </div>
    );
  }

function NestedDeckNav({ 
    deckId, sessionId, parentCardId, onBack 
  }: { 
    deckId: number, sessionId: number, parentCardId: number, onBack: () => void 
  }) {
    const { data: cards } = useCardsByDeck(deckId);
    const { data: deck } = useDeck(deckId);
    const { data: notes } = useNotesBySession(sessionId);
    const saveNote = useSaveNote();
    const [selectedCard, setSelectedCard] = useState<any | null>(null);

    const chosenCardId = useMemo(() => {
      if (!notes || !cards) return null;
      const cardIds = cards.map(c => c.id);
      const note = notes.find(n => n.parentId === parentCardId && n.slotIndex === (slotIndex ?? null) && cardIds.includes(n.cardId));
      return note ? note.cardId : null;
    }, [notes, cards, parentCardId]);

    const cardToShow = useMemo(() => {
      if (selectedCard) return selectedCard;
      if (chosenCardId && cards) {
        return cards.find(c => c.id === chosenCardId) || null;
      }
      return null;
    }, [selectedCard, chosenCardId, cards]);

    const handleNestedCardClick = (card: any) => {
      saveNote.mutate({ sessionId, cardId: card.id, content: "", parentId: parentCardId, slotIndex: slotIndex ?? null }, {
        onSuccess: () => setSelectedCard(card)
      });
    };

    if (!cards || !deck) return <div className="p-8 text-center animate-pulse text-primary font-display">Загрузка колоды...</div>;

    if (cardToShow) {
      return (
        <CardNoteDetail 
          card={cardToShow} 
          sessionId={sessionId} 
          parentId={parentCardId} slotIndex={slotIndex}
          onClose={selectedCard ? () => setSelectedCard(null) : onBack} 
        />
      );
    }

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <h3 className="font-display font-bold text-lg text-primary">{deck.name}</h3>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 p-1 custom-scrollbar">
          {cards.map((card) => (
            <div 
              key={card.id}
              onClick={() => handleNestedCardClick(card)}
              className="aspect-[2/3] rounded-lg border border-primary/30 cursor-pointer shadow-md transition-all hover:border-primary/60 hover:scale-105"
              style={{ backgroundImage: `url(${deck.coverImage})`, backgroundSize: 'cover' }}
            />
          ))}
        </div>
      </div>
    );
  }

  export default function CardSelector() {
    const [, params] = useRoute("/session/:sessionId/deck/:deckId");
    const [, setLocation] = useLocation();
    const sessionId = Number(params?.sessionId);
    const deckId = Number(params?.deckId);

    const { data: deck, isLoading: deckLoading } = useDeck(deckId);
    const { data: cards, isLoading: cardsLoading } = useCardsByDeck(deckId);
    const { data: notes, isLoading: notesLoading } = useNotesBySession(sessionId);
    const { data: session, isLoading: sessionLoading } = useSession(sessionId);
    const { data: goals, isLoading: goalsLoading } = useGoals();
    const saveNote = useSaveNote();

    const [activeCard, setActiveCard] = useState<any | null>(null);
    const [isChoosingId, setIsChoosingId] = useState<number | null>(null);
    const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

    const chosenRootCardId = useMemo(() => {
      if (!notes || !cards) return null;
      const deckCardIds = cards.map(c => c.id);
      const rootNote = notes.find(n => n.parentId === null && deckCardIds.includes(n.cardId));
      return rootNote ? rootNote.cardId : null;
    }, [notes, cards]);

    const handleClose = () => {
      setActiveCard(null);
      if (chosenRootCardId) {
        setLocation(`/session/${sessionId}`);
      }
    };

    useEffect(() => {
      if (!deckLoading && !sessionLoading && !goalsLoading && goals) {
        if (goals.length === 0) { setLocation("/"); return; }
        if (!session || session.status === 'locked') { setLocation("/"); return; }
        if (session.status !== 'in_progress' && session.status !== 'completed') {
          setLocation(`/session/${sessionId}`);
          return;
        }
        if (!deck || !session.deckIds.includes(deckId)) { setLocation("/"); return; }
      }
    }, [deck, deckLoading, session, sessionLoading, goals, goalsLoading, sessionId, deckId, setLocation]);

    useEffect(() => {
      if (!deckLoading && !cardsLoading && !notesLoading && chosenRootCardId && !activeCard && !isChoosingId) {
        const card = cards?.find(c => c.id === chosenRootCardId);
        if (card) setActiveCard(card);
      }
    }, [deckLoading, cardsLoading, notesLoading, chosenRootCardId, cards, activeCard, isChoosingId]);

    const handleCardClick = (card: any) => {
      if (chosenRootCardId !== null && chosenRootCardId !== card.id) return;
      if (chosenRootCardId === null && isChoosingId !== card.id) {
        setIsChoosingId(card.id);
        saveNote.mutate({ sessionId, cardId: card.id, content: "", parentId: null }, {
          onSuccess: () => { setIsChoosingId(null); setActiveCard(card); },
          onError: () => setIsChoosingId(null)
        });
      } else {
        setActiveCard(card);
      }
    };

    if (deckLoading || cardsLoading || notesLoading) return <MobileLayout><div className="text-center mt-20 text-primary animate-pulse font-display">Тасуем колоду...</div></MobileLayout>;
    if (!deck) return <MobileLayout><div className="text-center mt-20 font-display">Колода не найдена</div></MobileLayout>;

    if (chosenRootCardId !== null && activeCard) {
      return (
        <MobileLayout 
          title={deck.name}
          action={<Button variant="ghost" size="icon" onClick={() => setLocation(`/session/${sessionId}`)}><ArrowLeft className="w-5 h-5" /></Button>}
        >
          <div className="flex flex-col items-center justify-center p-4 min-h-[60vh]">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl">
               <CardNoteDetail card={activeCard} sessionId={sessionId} onClose={handleClose} />
            </div>
          </div>
        </MobileLayout>
      );
    }

    const shuffledCards = [...(cards || [])].sort(() => 0.5 - Math.random());

    return (
      <MobileLayout 
        title={deck.name}
        action={<Button variant="ghost" size="icon" onClick={() => setLocation(`/session/${sessionId}`)}><ArrowLeft className="w-5 h-5" /></Button>}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-max perspective-1000 p-2">
          <AnimatePresence>
            {shuffledCards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="aspect-[2/3] relative cursor-pointer group"
                onClick={() => handleCardClick(card)}
              >
                <motion.div className="w-full h-full relative transform-style-3d transition-transform duration-700 ease-out" animate={{ rotateY: flippedCards.has(card.id) ? 180 : 0 }}>
                  <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-primary/20 shadow-lg flex items-center justify-center overflow-hidden" style={{ backgroundImage: `url(${deck.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-0 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <span className="text-4xl font-bold text-white/40 font-display">{card.actionType === 'nested' ? 'N' : 'S'}</span>
                      {card.tips && <div className="px-2 py-0.5 rounded bg-primary/30 border border-primary/50 text-[10px] text-primary-foreground font-bold backdrop-blur-sm">СОВЕТ</div>}
                    </div>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <CardFace card={card} isChosen={false} />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Drawer open={!!activeCard} onOpenChange={(open) => !open && handleClose()}>
          <DrawerContent className="h-[85vh] glass-panel border-t border-primary/30 rounded-t-3xl max-w-md mx-auto">
            <div className="w-12 h-1.5 bg-primary/30 rounded-full mx-auto my-3" />
            <div className="flex-1 overflow-y-auto px-6 pb-6 w-full custom-scrollbar">
              {activeCard && <CardNoteDetail card={activeCard} sessionId={sessionId} onClose={handleClose} />}
            </div>
          </DrawerContent>
        </Drawer>
      </MobileLayout>
    );
  }