import { RouterProvider } from '@vkontakte/vk-mini-apps-router';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router, hierarchy, useActiveVkuiLocation, usePanelParams } from "./routes";
import { useVKBridge } from "./hooks/useVKBridge";
import GamePreparation from "./pages/GamePreparation";
import ScheduleView from "./pages/ScheduleView";
import SessionView from "./pages/SessionView";
import CardSelector from "./pages/CardSelector";
import ReportView from "./pages/ReportView";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { panel } = useActiveVkuiLocation() || {};
  const { sessionId, deckId } = usePanelParams();

  console.log('[AppContent] panel:', panel, 'sessionId:', sessionId, 'deckId:', deckId);

  if (panel === 'home_panel') {
    return <GamePreparation />;
  }

  if (panel === 'training_panel') {
    return <ScheduleView />;
  }

  if (panel === 'session_panel') {
    return <SessionView sessionId={sessionId} />;
  }

  if (panel === 'card_selector_panel') {
    return <CardSelector sessionId={sessionId} deckId={deckId} />;
  }

  if (panel === 'report_panel') {
    return <ReportView />;
  }

  return <NotFound />;
}

function App() {
  const { user, isInitialized, isMock } = useVKBridge();

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>✨ Эзотерический тренинг</h2>
          <p>Инициализация...</p>
          {isMock && <p style={{ fontSize: '12px', opacity: 0.7 }}>Режим разработки</p>}
        </div>
      </div>
    );
  }

  console.log('Приложение запущено, пользователь:', user);
  console.log('Режим:', isMock ? 'mock' : 'реальный VK');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} hierarchy={hierarchy}>
          <AppContent />
        </RouterProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
