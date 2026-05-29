import { AnimatePresence, LayoutGroup } from "motion/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { Welcome } from "./pages/Welcome";
import { Home } from "./pages/Home";
import { Workspace } from "./pages/Workspace";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { useAppStore } from "./store/useAppStore";

export const App = () => {
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const isAuthed = Boolean(user);

  return (
    <LayoutGroup>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/welcome" element={<Welcome />} />
          <Route
            path="/"
            element={isAuthed ? <AppShell /> : <Navigate to="/welcome" replace />}
          >
            <Route index element={<Home />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="*"
            element={<Navigate to={isAuthed ? "/" : "/welcome"} replace />}
          />
        </Routes>
      </AnimatePresence>
    </LayoutGroup>
  );
};
