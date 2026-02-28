import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useDeck, useCardsByDeck, useNotesBySession, useSaveNote, useDecks } from "@/hooks/use-game";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";

// Recursive Deck Navigation Component inside the Drawer
function NestedDeckNav({ 
  deckId, sessionId, parentCardId, onBack 
}: { 
  deckId: number, sessionId: number, parentCardId: number, onBack: () => void 
}) {
  const { data: cards } = useCardsByDeck(deckId);
  const { data: deck } = useDeck(deckId);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  if (!cards || !deck) return <div className="p-8 text-center animate-pulse">Загрузка колоды...</div>;

  if (selectedCard) {
    return (
      <CardNoteDetail 
        card={selectedCard} 
        sessionId={sessionId} 
        parentId={parentCardId}
        onClose={() => setSelectedCard(null)} 
      />
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h3 className="font-display font-bold text-lg">{deck.name}</h3>
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 p-1">
        {cards.map((card) => (
          <div 
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="aspect-[2/3] rounded-lg border border-primary/30 cursor-pointer shadow-md"
            style={{ backgroundImage: `url(${deck.coverImage})`, backgroundSize: 'cover' }}
          />
        ))}
      </div>
    </div>
  );
}

// Card Note Detail Component (used recursively)
function CardNoteDetail({ 
  card, sessionId, parentId = null, onClose 
}: { 
  card: any, sessionId: number, parentId?: number | null, onClose: () => void 
}) {
  const { data: notes } = useNotesBySession(sessionId);
  const { data: allDecks } = useDecks();
  const saveNote = useSaveNote();
  
  // Find existing note for this exact card context
  const existingNote = notes?.find(n => n.cardId === card.id && n.parentId === parentId);
  const [content, setContent] = useState(existingNote?.content || "");
  const [isSaved, setIsSaved] = useState(false);
  const [activeNestedDeck, setActiveNestedDeck] = useState<number | null>(null);

  const hasNested = card.requiredDecks && card.requiredDecks.length > 0;

  // Track the chain of parent cards to show nesting
  const parentChain = useMemo(() => {
    const chain: any[] = [];
    let currentParentId = parentId;
    while (currentParentId !== null) {
      const parentNote = notes?.find(n => n.cardId === currentParentId);
      // This is a bit simplified, but helps show the path
      if (parentNote) {
        chain.unshift(parentNote);
        currentParentId = parentNote.parentId;
      } else {
        break;
      }
    }
    return chain;
  }, [notes, parentId]);

  const handleSave = () => {
    saveNote.mutate({ sessionId, cardId: card.id, content, parentId }, {
      onSuccess: () => {
        setIsSaved(true);
        // If it's a nested card, it should always close after saving to return to parent
        // If it's a standard card with NO nested decks, it should also close
        if (parentId !== null || !hasNested) {
          setTimeout(() => {
            setIsSaved(false);
            onClose();
          }, 1000);
        } else {
          // It's a root card with nested decks, keep it open so user can click nested decks
          setTimeout(() => setIsSaved(false), 2000);
        }
      }
    });
  };

  if (activeNestedDeck) {
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
      <div className="flex justify-between items-start">
        <div>
          {parentChain.length > 0 && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
              {parentChain.map((p, i) => (
                <span key={i} className="flex items-center gap-1">
                  Карта #{p.cardId} <ChevronRight className="w-2 h-2" />
                </span>
              ))}
            </div>
          )}
          <span className="text-xs font-bold text-primary uppercase tracking-wider">{card.actionType}</span>
          <h3 className="font-display text-xl font-bold mt-1">{card.name}</h3>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>
      
      <p className="text-sm text-foreground/80 leading-relaxed bg-background/50 p-3 rounded-lg border border-white/5">
        {card.description}
      </p>

      {hasNested && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-sm font-semibold text-primary">Требуются дополнительные карты:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {card.requiredDecks.map((reqDeckId: number) => {
              const reqDeck = allDecks?.find(d => d.id === reqDeckId);
              return (
                <Button 
                  key={reqDeckId} 
                  variant="outline" 
                  className="shrink-0 h-16 w-12 p-0 border-primary/50 bg-card hover:bg-primary/20 relative overflow-hidden"
                  onClick={() => setActiveNestedDeck(reqDeckId)}
                >
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10">
                    <span className="text-xs font-bold font-mono text-primary">N</span>
                  </div>
                  {reqDeck?.coverImage && (
                    <img src={reqDeck.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2 pt-2 border-t border-white/10">
        <label className="text-sm font-semibold text-foreground">Заметка по карте</label>
        <Textarea 
          value={content}
          onChange={(e) => { setContent(e.target.value); setIsSaved(false); }}
          className="flex-1 min-h-[120px] resize-none bg-background/50 border-white/10 focus-visible:ring-primary/50"
          placeholder="Опишите свои мысли..."
        />
        <Button 
          onClick={handleSave} 
          disabled={!content.trim() || saveNote.isPending || isSaved}
          className={`w-full transition-all ${isSaved ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-primary'}`}
        >
          {isSaved ? <><Check className="w-4 h-4 mr-2" /> Сохранено</> : 'Сохранить заметку'}
        </Button>
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
  const { data: notes } = useNotesBySession(sessionId);
  
  // Filter cards that have notes in this session for this deck AS A ROOT CHOICE
  const chosenRootCardId = useMemo(() => {
    if (!notes || !cards) return null;
    const deckCardIds = cards.map(c => c.id);
    const rootNote = notes.find(n => n.parentId === null && deckCardIds.includes(n.cardId));
    return rootNote ? rootNote.cardId : null;
  }, [notes, cards]);

  // Shuffle cards once on load
  const shuffledCards = useMemo(() => {
    if (!cards) return [];
    return [...cards].sort(() => Math.random() - 0.5);
  }, [cards]);

  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [activeCard, setActiveCard] = useState<any | null>(null);

  const handleCardClick = (card: any) => {
    // If we already have a root choice, only allow clicking THAT card
    if (chosenRootCardId !== null && chosenRootCardId !== card.id) {
      return;
    }

    setFlippedCards(prev => {
      const next = new Set(prev);
      next.add(card.id);
      return next;
    });
    // Add small delay for animation
    setTimeout(() => {
      setActiveCard(card);
    }, 300);
  };

  if (deckLoading || cardsLoading) return <MobileLayout><div className="text-center mt-20">Тасуем колоду...</div></MobileLayout>;
  if (!deck) return <MobileLayout><div className="text-center mt-20">Колода не найдена</div></MobileLayout>;

  const displayCards = chosenRootCardId !== null 
    ? shuffledCards.filter(c => c.id === chosenRootCardId)
    : shuffledCards;

  return (
    <MobileLayout 
      title={deck.name}
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/session/${sessionId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      }
    >
      <div className={`grid ${chosenRootCardId !== null ? 'grid-cols-1 justify-items-center' : 'grid-cols-2 sm:grid-cols-3'} gap-4 auto-rows-max perspective-1000 p-2`}>
        <AnimatePresence>
          {displayCards.map((card, idx) => {
            const isFlipped = flippedCards.has(card.id) || chosenRootCardId === card.id;
            const isChosen = chosenRootCardId === card.id;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`${chosenRootCardId !== null ? 'w-48 sm:w-56' : 'w-full'} aspect-[2/3] relative cursor-pointer group`}
                onClick={() => handleCardClick(card)}
              >
                <motion.div
                  className="w-full h-full relative transform-style-3d transition-transform duration-700 ease-out"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                  {/* Front (Face down) */}
                  <div 
                    className="absolute inset-0 backface-hidden rounded-xl border-2 border-primary/20 shadow-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundImage: `url(${deck.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    <div className="absolute inset-0 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors" />
                    <span className="relative z-10 text-4xl font-bold text-white/40 font-display">
                      {card.actionType === 'nested' ? 'N' : 'S'}
                    </span>
                  </div>

                  {/* Back (Face up) */}
                  <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-card border-2 shadow-xl rounded-xl p-4 flex flex-col justify-center items-center text-center overflow-hidden ${isChosen ? 'border-primary shadow-[0_0_15px_var(--primary)]' : 'border-primary/50'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                    <span className="text-[10px] font-bold text-primary mb-2 uppercase">{card.actionType}</span>
                    <h5 className="font-display font-bold text-sm leading-tight text-foreground">{card.name}</h5>
                    {isChosen && <div className="mt-2 bg-primary/20 px-2 py-0.5 rounded text-[10px] text-primary font-bold">ВЫБРАНО</div>}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Slide-out Drawer for Card Details & Notes */}
      <Drawer open={!!activeCard} onOpenChange={(open) => !open && setActiveCard(null)}>
        <DrawerContent className="h-[85vh] glass-panel border-t border-primary/30 rounded-t-3xl">
          <div className="w-12 h-1.5 bg-primary/30 rounded-full mx-auto my-3" />
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {activeCard && (
              <CardNoteDetail 
                card={activeCard} 
                sessionId={sessionId} 
                onClose={() => setActiveCard(null)} 
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
}
