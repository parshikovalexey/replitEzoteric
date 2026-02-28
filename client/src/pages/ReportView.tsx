import { useRef, useState } from "react";
import { useGoals, useSessions, useDecks } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ReportView() {
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { data: goals } = useGoals();
  const { data: sessions } = useSessions();
  const { data: decks } = useDecks(); // Needed if we want to resolve deck names
  const [isExporting, setIsExporting] = useState(false);

  // Get the active goal
  const goal = goals?.[goals.length - 1]; // Use the latest goal
  
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff' // Force white background for PDF
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

  const handlePrint = () => {
    window.print();
  };

  if (!sessions || !goal) return <div className="p-10 text-center">Загрузка данных для отчета...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Non-printable Header */}
      <header className="print:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/training")}>
          <ArrowLeft className="w-5 h-5 mr-2" /> Назад
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Печать
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2 bg-primary">
            <Download className="w-4 h-4" /> {isExporting ? 'Генерация...' : 'Сохранить PDF'}
          </Button>
        </div>
      </header>

      {/* Printable Area - Forced styling for A4 paper look */}
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

          <div className="space-y-12 pt-4">
            {sessions.map((session) => (
              <div key={session.id} className="space-y-4 page-break-inside-avoid">
                <div className="flex flex-col border-b border-black/10 pb-2">
                  <h3 className="text-2xl font-display font-bold text-[#2b005e]">День {session.number}: {session.name}</h3>
                  <span className="text-sm text-gray-500">{session.status === 'completed' ? 'Завершена' : 'В процессе'}</span>
                </div>
                
                {session.notes ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Итоговые выводы по сессии</h4>
                    <p className="whitespace-pre-wrap text-gray-800">{session.notes}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">Нет общих заметок по сессии.</p>
                )}

                {/* Note: In a complete implementation, we would fetch useNotesBySession for each session here and render the card notes. 
                    For the UI sake, we display a placeholder section if no card notes exist. */}
                <div className="pl-4 border-l-2 border-[#d4af37]">
                  <h4 className="text-sm font-bold text-[#d4af37] uppercase mb-3">Детализация по картам</h4>
                  <p className="text-sm text-gray-600 italic">Здесь будут отображаться заметки к конкретным картам с сохранением структуры вложенности.</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-20 text-center opacity-50 text-sm">
            <p>Сгенерировано в приложении Эзотерической Игры</p>
          </div>
        </div>
      </div>
    </div>
  );
}
