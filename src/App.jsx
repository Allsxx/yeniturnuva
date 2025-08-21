import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Elemination from "./components/Elemination";
import Group from "./components/Group";
import Turnuva from "./components/Turnuva"; // Ana sayfa
import OnlineGiris from "./components/OnlineGiris";
import Register from "./components/Register";
import Lig from "./components/Lig";
import Navbar from "./components/Navbar";
import './App.css'; // CSS stillerini içe aktar
import MyTournaments from "./components/MyTournaments"; // Geçmiş turnuvalar sayfası
import TournamentDetail from "./components/TournamentDetails"; // Turnuva detay sayfas
// Gerekirse diğer sayfalar...

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/tournament/:id" element={<TournamentDetail />} />
        <Route path="/my-tournaments" element={<MyTournaments />} />
        <Route path="/" element={<Turnuva />} />
        <Route path="/lig" element={<Lig />} />
        <Route path="/elemination" element={<Elemination />} />
        <Route path="/group" element={<Group />} />
        <Route path="/onlineGiris" element={<OnlineGiris />} />
        <Route path="/register" element={<Register />} />
        {/* 404 fallback */}
        <Route path="*" element={<div>404 - Sayfa Bulunamadı</div>} />
      </Routes>
    </Router>
  );
}

export default App;