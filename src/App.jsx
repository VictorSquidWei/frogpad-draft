import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ChampionsProvider } from "./lib/champions.jsx";
import Pond from "./components/Pond.jsx";
import NavBar from "./components/NavBar.jsx";
import TierListPage from "./pages/TierListPage.jsx";
import CompsPage from "./pages/CompsPage.jsx";
import MatchupsPage from "./pages/MatchupsPage.jsx";
import DraftPage from "./pages/DraftPage.jsx";

export default function App() {
  return (
    <ChampionsProvider>
      <Pond />
      <div className="app">
        <NavBar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/tier/top" replace />} />
            <Route path="/tier/:role" element={<TierListPage />} />
            <Route path="/comps" element={<CompsPage />} />
            <Route path="/matchups" element={<MatchupsPage />} />
            <Route path="/draft" element={<DraftPage />} />
            <Route path="*" element={<Navigate to="/tier/top" replace />} />
          </Routes>
        </main>
      </div>
    </ChampionsProvider>
  );
}
