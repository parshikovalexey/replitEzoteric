import { useRef, useState, useMemo, useEffect } from "react";
  import { useGoals, useSessions, useDecks, useAllCards, useAllNotes } from "@/hooks/use-game";
  import { Button } from "@/components/ui/button";
  import { ArrowLeft, Download, Printer } from "lucide-react";
  import { useLocation } from "wouter";
  import html2canvas from "html2canvas";
  import jsPDF from "jspdf";
  import { format } from "date-fns";
  import { ru } from "date-fns/locale";

  function CardNode({ cardId, notes, allCards, level = 0 }: { cardId: number, notes: any[], allCards: any[], level?: number }) {
    const card = allCards.find(c => c.id === cardId);
    const cardNotes = notes.filter(n => n.cardId === cardId);
    
    if (!card) return null;

    return (
      <div className="space-y-4" style={{ marginLeft: level > 0 ? `${level * 20}px` : 0 }}>
        <div className="pl-4 border-l-2 border-[#d4af37]">
          <h4 className="text-lg font-bold text-[#2b005e]">{card.name}</h4>
          {cardNotes.map((note, idx) => (
            <div key={idx} className="mt-2 p-3 bg-gray-50 rounded border border-gray-100 italic text-gray-700 whitespace-pre-wrap">
              {note.content || "Без заметки"}
            </div>
          ))}
        </div>
        {/* Recursively render children */}
        {notes.filter(n => n.parentId === cardId).map((childNote, idx) => (
          <CardNode 
            key={`child-${childNote.id}-${idx}`} 
            cardId={childNote.cardId} 
            notes={notes} 
            allCards={allCards} 
            level={level + 1} 
          />
        ))}
      </div>
    );
  }

  export default function ReportView() {
    const [, setLocation] = useLocation();
    const printRef = useRef<HTMLDivElement>(null);
    
    const { data: goals } = useGoals();
    const { data: sessions } = useSessions();
    const { data: allCards } = useAllCards();
    const { data: allNotes } = useAllNotes();
    const [isExporting, setIsExporting] = useState(false);
    useEffect(() => {
      if (sessions && sessions.length > 0) {
        const isFinished = sessions.every(s => s.status === 'completed');
        if (!isFinished) {
          setLocation("/");
        }
      }
    }, [sessions, setLocation]);
  
    
  

    const goal = goals?.[goals.length - 1];
    
    const handleExportPDF = async () => {
      if (!printRef.current) return;
      setIsExporting(true);
      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`transform-report-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    };

    if (!sessions || !goal || !allCards || !allNotes) return <div className="p-10 text-center">Загрузка данных для отчета...</div>;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="print:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/training")}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Назад
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> Печать
            </Button>
            <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2 bg-primary">
              <Download className="w-4 h-4" /> {isExporting ? 'Генерация...' : 'Сохранить PDF'}
            </Button>
          </div>
        </header>

        <div className="max-w-[210mm] mx-auto bg-white text-black p-10 md:p-20 shadow-2xl my-8 print:my-0 print:shadow-none print:p-0">
          <div ref={printRef} className="space-y-8 bg-white text-black font-sans">
            
            <div className="text-center space-y-4 pb-8 border-b-2 border-black/10">
              <h1 className="font-display text-4xl font-bold text-[#2b005e]">Трансформационный Отчет</h1>
              <p className="text-gray-500">
                Сформировано: {format(new Date(), 'dd MMMM yyyy', { locale: ru })}
              </p>
            </div>

            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-[#e9ecef]">
              <h2 className="text-xl font-bold text-[#2b005e] mb-2 uppercase tracking-wide">Главное намерение</h2>
              <p className="text-2xl font-serif">Хочу иметь личный доход <span className="font-bold text-[#d4af37]">{goal.amount}</span> в год</p>
            </div>

            <div className="space-y-16 pt-4">
              {sessions.map((session) => {
                const sessionNotes = allNotes.filter(n => n.sessionId === session.id);
                const rootNotes = sessionNotes.filter(n => n.parentId === null);
                
                return (
                  <div key={session.id} className="space-y-8 page-break-inside-avoid">
                    <div className="flex flex-col border-b-2 border-[#2b005e]/20 pb-2">
                      <h3 className="text-3xl font-display font-bold text-[#2b005e]">День {session.number}: {session.name}</h3>
                      <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {session.status === 'completed' ? 'Завершена' : 'В процессе'}
                      </span>
                    </div>

                    <div className="space-y-8">
                      {rootNotes.map((rootNote, idx) => (
                        <CardNode 
                          key={`root-${rootNote.id}-${idx}`} 
                          cardId={rootNote.cardId} 
                          notes={sessionNotes} 
                          allCards={allCards} 
                        />
                      ))}
                    </div>

                    {session.notes && (
                      <div className="mt-8 p-6 bg-[#2b005e]/5 rounded-xl border-l-4 border-[#2b005e]">
                        <h4 className="text-sm font-bold text-[#2b005e] uppercase mb-2">Итоговые выводы по сессии</h4>
                        <p className="whitespace-pre-wrap text-lg leading-relaxed">{session.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-20 text-center opacity-30 text-xs">
              <p>Сгенерировано в приложении Эзотерической Игры</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  