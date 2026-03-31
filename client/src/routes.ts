import { 
  createPanel, 
  createView, 
  RoutesConfig, 
  RouteLeaf, 
  createHashRouter,
  useParams,
  useRouteNavigator,
  useActiveVkuiLocation
} from '@vkontakte/vk-mini-apps-router';

const MAIN_VIEW = 'main_view';

const PANELS = {
  HOME: 'home_panel',
  TRAINING: 'training_panel',
  SESSION: 'session_panel',
  CARD_SELECTOR: 'card_selector_panel',
  REPORT: 'report_panel',
} as const;

export const routes = RoutesConfig.create([
  createView(MAIN_VIEW, [
    createPanel(PANELS.HOME, '/'),
    createPanel(PANELS.TRAINING, '/training'),
    createPanel(PANELS.REPORT, '/report'),
    createPanel(PANELS.SESSION, '/session/:id'),
    createPanel(PANELS.CARD_SELECTOR, '/session/:id/deck/:deckId'),
  ]),
]);

export const hierarchy: RouteLeaf[] = [
  {
    path: '/',
    children: [
      { path: '/session/:id' },
    ],
  },
];

export const router = createHashRouter(routes.getRoutes());

export function usePanelParams() {
  const params = useParams<'id' | 'deckId'>();
  return {
    sessionId: params?.id ? Number(params.id) : null,
    deckId: params?.deckId ? Number(params.deckId) : null,
  };
}

export { useRouteNavigator, useActiveVkuiLocation };
