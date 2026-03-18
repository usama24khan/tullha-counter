import { useGameStore } from './store/gameStore';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const isStarted = useGameStore(s => s.isStarted);

  if (!isStarted) return <SetupPage />;
  return <DashboardPage />;
}