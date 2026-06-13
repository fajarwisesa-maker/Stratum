// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { UploadView } from './views/UploadView';
import { DashboardView } from './views/DashboardView';
import { SimulatorView } from './views/SimulatorView';
import { HistoryView } from './views/HistoryView';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<UploadView />}    />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/simulator" element={<SimulatorView />} />
        <Route path="/history"   element={<HistoryView />}   />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 200, minHeight: '100vh' }}>
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
