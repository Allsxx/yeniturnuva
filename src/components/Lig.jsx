import React, { useState, useContext } from "react";
import trophy from "../assets/trophy.ico";
import PuanTablosu from "./PuanTablosu";
import { useEffect } from "react";
import { UserContext } from "./UserContext";
import {
  addPlayer,
  addTournament,
  addTournamentPlayer,
  addMatch,
} from "../supabaseService";

const PUAN_KAZAN = 3;
const PUAN_BERABERE = 1;

function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateRoundRobinFixtures(teams, rematch = false) {
  let n = teams.length;
  let isOdd = n % 2 !== 0;
  let teamList = [...teams];
  if (isOdd) {
    teamList.push("Bay");
    n += 1;
  }

  const weeks = [];
  for (let round = 0; round < n - 1; round++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const teamA = teamList[i];
      const teamB = teamList[n - 1 - i];
      if (teamA !== "Bay" && teamB !== "Bay") {
        matches.push({ ev: teamA, dep: teamB });
      }
    }
    weeks.push(matches);
    teamList.splice(1, 0, teamList.pop());
  }
  if (rematch) {
    const reverseWeeks = weeks.map(hafta =>
      hafta.map(mac => ({ ev: mac.dep, dep: mac.ev }))
    );
    return [...weeks, ...reverseWeeks];
  }
  return weeks;
}

const Lig = () => {
  const [title, setTitle] = useState("");
  const [takimSayisi, setTakimSayisi] = useState("");
  const [isimler, setIsimler] = useState([]);
  const [fikstur, setFikstur] = useState([]);
  const [skorlar, setSkorlar] = useState({});
  const [rövanş, setRövanş] = useState(false);
  const [takimlar, setTakimlar] = useState([]);
  const [showPuanTablosu, setShowPuanTablosu] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);
  const [takimIdler, setTakimIdler] = useState([]);

  const { user } = useContext(UserContext);
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Sayfayı yenilerseniz turnuva kapatılacaktır!";
      return "Sayfayı yenilerseniz turnuva kapatılacaktır!";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);


  const handleIsimGir = async () => {
    if (!takimSayisi || takimSayisi < 4) {
      alert("En az 4 takım olmalı!");
      return;
    }
    if (!title.trim()) {
      alert("Turnuva adı giriniz!");
      return;
    }
    try {
      const tournament = await addTournament(title, user ? user.id : null, "elimination");
      if (!tournament || !tournament.id) {
        throw new Error("Turnuva oluşturulamadı: Supabase veri dönmedi!");
      }
      setTournamentId(tournament.id);
    } catch (error) {
      alert("Turnuva kaydedilemedi: " + error.message);
    }

    setIsimler(Array(parseInt(takimSayisi)).fill(""));
    setFikstur([]);
    setSkorlar({});
    setTakimlar([]);
    setTakimIdler([]);
    setShowPuanTablosu(false);
  };

  const handleIsimChange = (idx, val) => {
    const yeni = [...isimler];
    yeni[idx] = val;
    setIsimler(yeni);
  };

  const handleFiksturOlustur = async () => {
    if (isimler.some((x) => !x.trim())) {
      alert("Tüm isimleri doldurun!");
      return;
    }
    const karisikIsimler = shuffleArray(isimler);
    let ids = [];
    let takimlarSupabase = [];
    for (const name of karisikIsimler) {
      try {
        const player = await addPlayer(name);
        ids.push(player.id);
        await addTournamentPlayer(tournamentId, player.id);
        takimlarSupabase.push({ name: player.name, id: player.id });
      } catch (error) {
        alert("Takım eklenemedi: " + error.message);
        return;
      }
    }
    setTakimIdler(ids);
    setTakimlar(takimlarSupabase);

    const haftalar = generateRoundRobinFixtures(karisikIsimler, rövanş);
    setFikstur(haftalar);
    setSkorlar({});
    setShowPuanTablosu(false);
  };

  const handleSkorChange = (haftaIdx, macIdx, takim, val) => {
    setSkorlar(prev => ({
      ...prev,
      [`${haftaIdx}_${macIdx}_${takim}`]: val
    }));
  };

  const handleKaydetMatches = async () => {
    if (!tournamentId) {
      alert("Turnuva ID yok!");
      return;
    }
    let eksik = false;
    for (let haftaIdx = 0; haftaIdx < fikstur.length; haftaIdx++) {
      for (let macIdx = 0; macIdx < fikstur[haftaIdx].length; macIdx++) {
        const mac = fikstur[haftaIdx][macIdx];
        const ev = mac.ev;
        const dep = mac.dep;
        const s1 = parseInt(skorlar[`${haftaIdx}_${macIdx}_1`]);
        const s2 = parseInt(skorlar[`${haftaIdx}_${macIdx}_2`]);
        if (isNaN(s1) || isNaN(s2)) {
          eksik = true;
          continue;
        }
        const evObj = takimlar.find(t => t.name === ev);
        const depObj = takimlar.find(t => t.name === dep);
        const evId = evObj ? evObj.id : null;
        const depId = depObj ? depObj.id : null;
        let winnerId = null;
        if (s1 > s2) winnerId = evId;
        else if (s2 > s1) winnerId = depId;
        try {
          await addMatch({
            tournament_id: tournamentId,
            round: haftaIdx + 1,
            player1_id: evId,
            player2_id: depId,
            player1_score: s1,
            player2_score: s2,
            winner_id: winnerId,
            is_bye: false
          });
        } catch (error) {
          alert("Maç kaydedilemedi: " + error.message);
        }
      }
    }
    if (eksik) {
      alert("Tüm skorları girin.");
    } else {
      alert("Maçlar kaydedildi (Supabase)!");
    }
  };

  let tabloTemp = takimlar.map(t => ({
    name: t.name,
    O: 0, G: 0, B: 0, M: 0, A: 0, Y: 0, AV: 0, P: 0
  }));

  for (let haftaIdx = 0; haftaIdx < fikstur.length; haftaIdx++) {
    for (let macIdx = 0; macIdx < fikstur[haftaIdx].length; macIdx++) {
      const mac = fikstur[haftaIdx][macIdx];
      const ev = mac.ev;
      const dep = mac.dep;
      const s1 = parseInt(skorlar[`${haftaIdx}_${macIdx}_1`]);
      const s2 = parseInt(skorlar[`${haftaIdx}_${macIdx}_2`]);
      if (isNaN(s1) || isNaN(s2)) continue;
      const evTablo = tabloTemp.find(t => t.name === ev);
      const depTablo = tabloTemp.find(t => t.name === dep);
      if (!evTablo || !depTablo) continue;
      evTablo.O += 1;
      depTablo.O += 1;
      evTablo.A += s1;
      evTablo.Y += s2;
      depTablo.A += s2;
      depTablo.Y += s1;
      evTablo.AV = evTablo.A - evTablo.Y;
      depTablo.AV = depTablo.A - depTablo.Y;
      if (s1 > s2) {
        evTablo.G += 1;
        depTablo.M += 1;
        evTablo.P += PUAN_KAZAN;
      } else if (s1 < s2) {
        depTablo.G += 1;
        evTablo.M += 1;
        depTablo.P += PUAN_KAZAN;
      } else {
        evTablo.B += 1;
        depTablo.B += 1;
        evTablo.P += PUAN_BERABERE;
        depTablo.P += PUAN_BERABERE;
      }
    }
  }
  tabloTemp.sort((a, b) => b.P - a.P || b.AV - a.AV || b.A - a.A);

  return (
    <div>
      <div className="elemination-container">
        <div className="elemination-header">
          <img src={trophy} alt="trophy" />
          <span>TURNUVA</span>
        </div>
        <h2 className="elemination-title">Lig Turnuvası</h2>
        {isimler.length === 0 && (
          <>
            <label className="elemination-label">Turnuva Adı:</label>
            <input
              className="elemination-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Turnuva adı giriniz"
            />
            <label className="elemination-label">Takım/Oyuncu Sayısı:</label>
            <input
              className="elemination-input"
              type="number"
              min={4}
              value={takimSayisi}
              onChange={e => setTakimSayisi(e.target.value)}
            />
            <button className="elemination-btn" onClick={handleIsimGir}>İsimleri Gir & Turnuva Başlat</button>
          </>
        )}
        {isimler.length > 0 && fikstur.length === 0 && (
          <div>
            {isimler.map((isim, idx) => (
              <div key={idx}>
                <input
                  className="elemination-input"
                  type="text"
                  placeholder={`${idx + 1}. Takım/Oyuncu'nun Adı`}
                  value={isim}
                  onChange={e => handleIsimChange(idx, e.target.value)}
                />
              </div>
            ))}
            <label className="rovanş-label" style={{ marginTop: "10px", display: "inline-block" }}>
              <input
                type="checkbox"
                checked={rövanş}
                onChange={e => setRövanş(e.target.checked)}
                className="rovanş-checkbox"
                style={{ marginRight: "7px" }}
              />
              Rövanşlı oynansın (çift maç)
            </label>
            <br />
            <button className="elemination-btn" onClick={handleFiksturOlustur}>Fikstür Oluştur & Takımları Kaydet</button>
          </div>
        )}
        {fikstur.length > 0 && (
          <div>
            <h2 className="elemination-title">Fikstür ve Skor Girişi</h2>
            {fikstur.map((hafta, haftaIdx) => (
              <div key={haftaIdx} style={{ marginBottom: '24px' }}>
                <div className="week">
                  <h2>{haftaIdx + 1}. Hafta</h2>
                  <hr />
                </div>
                {hafta.map((mac, macIdx) => (
                  <div key={macIdx} className="elemination-match" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <label className="elemination-label" style={{ minWidth: '100px', textAlign: 'right' }}>
                        {mac.ev}
                      </label>
                      <input
                        className="elemination-score-input"
                        type="number"
                        min={0}
                        style={{ width: '70px', }}
                        value={skorlar[`${haftaIdx}_${macIdx}_1`] || ""}
                        onChange={e => handleSkorChange(haftaIdx, macIdx, 1, e.target.value)}
                      />
                    </div>
                    <span className="elemination-vs" style={{ fontWeight: 'bold' }}>VS</span>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <input
                        className="elemination-score-input"
                        type="number"
                        min={0}
                        style={{ width: '70px', marginRight: '10px' }}
                        value={skorlar[`${haftaIdx}_${macIdx}_2`] || ""}
                        onChange={e => handleSkorChange(haftaIdx, macIdx, 2, e.target.value)}
                      />
                      <label className="elemination-label" style={{ minWidth: '100px', textAlign: 'left' }}>
                        {mac.dep}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {takimlar.length > 0 && (
              <button
                className="elemination-btn"
                style={{ marginTop: 16, marginRight: 16 }}
                onClick={handleKaydetMatches}
              >
                Maçları Kaydet
              </button>
            )}
            {takimlar.length > 0 && (
              <button
                className="elemination-btn"
                style={{ marginTop: 16 }}
                onClick={() => setShowPuanTablosu((prev) => !prev)}
              >
                {showPuanTablosu ? "Puan Tablosunu Gizle" : "Puan Tablosunu Göster"}
              </button>
            )}
          </div>
        )}
        {takimlar.length > 0 && showPuanTablosu && (
          <PuanTablosu tablo={tabloTemp} />
        )}
      </div>
    </div>
  );
};

export default Lig;