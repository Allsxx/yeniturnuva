import React, { useState, useContext, useEffect } from "react";
import trophy from "../assets/trophy.ico";
import { UserContext } from "./UserContext";
import {
  addPlayer,
  addTournament,
  addTournamentPlayer,
  addMatch,
} from "../supabaseService";
import Elemination from "./Elemination";




function generateRoundRobinFixtures(teams) {

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
  return weeks;
}



function gruplaraAyir(oyuncular) {
  const shuffled = [...oyuncular].sort(() => Math.random() - 0.5);
  const gruplar = [];
  for (let i = 0; i < shuffled.length; i += 4) {
    gruplar.push(shuffled.slice(i, i + 4));
  }
  return gruplar;
}


function puanTablosuHesapla(grup, skorlar, fikstur) {
  const PUAN_KAZAN = 3;
  const PUAN_BERABERE = 1;
  let tablo = grup.map(name => ({
    name,
    O: 0, G: 0, B: 0, M: 0, A: 0, Y: 0, AV: 0, P: 0
  }));

  fikstur.forEach((hafta, haftaIdx) => {
    hafta.forEach((mac, macIdx) => {
      const s1 = parseInt(skorlar[`${haftaIdx}_${macIdx}_1`] || "NaN");
      const s2 = parseInt(skorlar[`${haftaIdx}_${macIdx}_2`] || "NaN");
      const ev = mac.ev;
      const dep = mac.dep;
      if (isNaN(s1) || isNaN(s2)) return;
      const evTablo = tablo.find(t => t.name === ev);
      const depTablo = tablo.find(t => t.name === dep);
      if (!evTablo || !depTablo) return;

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
      } else if (s2 > s1) {
        depTablo.G += 1;
        evTablo.M += 1;
        depTablo.P += PUAN_KAZAN;
      } else {
        evTablo.B += 1;
        depTablo.B += 1;
        evTablo.P += PUAN_BERABERE;
        depTablo.P += PUAN_BERABERE;
      }
    });
  });
  tablo.sort((a, b) => b.P - a.P || b.AV - a.AV || b.A - a.A);
  return tablo;
}


function PuanTablosu({ tablo }) {
  return (
    <table className="lig-standings-table" style={{ marginTop: 15 }}>
      <thead>
        <tr>
          <th>#</th>
          <th>İsim</th>
          <th>O</th>
          <th>G</th>
          <th>B</th>
          <th>M</th>
          <th>A</th>
          <th>Y</th>
          <th>AV</th>
          <th>P</th>
        </tr>
      </thead>
      <tbody>
        {tablo.map((row, i) => (
          <tr key={row.name}>
            <td>{i + 1}</td>
            <td>{row.name}</td>
            <td>{row.O}</td>
            <td>{row.G}</td>
            <td>{row.B}</td>
            <td>{row.M}</td>
            <td>{row.A}</td>
            <td>{row.Y}</td>
            <td>{row.AV}</td>
            <td>{row.P}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


function otomatikEslestir(oyuncular) {
  const karisik = [...oyuncular].sort(() => Math.random() - 0.5);
  const eslesmelerYeni = [];
  let bye = null;
  for (let i = 0; i < karisik.length - 1; i += 2) {
    eslesmelerYeni.push([karisik[i], karisik[i + 1]]);
  }
  if (karisik.length % 2 === 1) {
    bye = karisik[karisik.length - 1];
  }
  return { eslesmelerYeni, bye };
}

const Group = () => {
  const [title, setTitle] = useState("");
  const [oyuncuSayisi, setOyuncuSayisi] = useState("");
  const [isimler, setIsimler] = useState([]);
  const [gruplar, setGruplar] = useState([]);
  const [grupFiksturleri, setGrupFiksturleri] = useState([]);
  const [grupSkorlar, setGrupSkorlar] = useState([]);
  const [showTablo, setShowTablo] = useState([]);
  const [ustTurOyuncular, setUstTurOyuncular] = useState([]);
  const [elemeyeGec, setElemeyeGec] = useState(false);
  const [elemeEslesmeleri, setElemeEslesmeleri] = useState([]);
  const [elemeBye, setElemeBye] = useState(null);
  const [tournamentId, setTournamentId] = useState(null);

  const { user } = useContext(UserContext);
  useEffect(() => {
    
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Sayfayı yenilerseniz turnuva kapatılacaktır!";
      return "Sayfayı yenilerseniz turnuva kapatılacaktır!";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  const handleIsimGir = async () => {
    if (!oyuncuSayisi || oyuncuSayisi % 4 !== 0 || oyuncuSayisi < 4) {
      alert("Oyuncu sayısı en az 4 ve 4'ün katı olmalı!");
      return;
    }
    if (!title.trim()) {
      alert("Turnuva adı giriniz!");
      return;
    }
    setIsimler(Array(parseInt(oyuncuSayisi)).fill(""));
    setGruplar([]);
    setElemeyeGec(false);
    setGrupSkorlar([]);
    setShowTablo([]);
    try {
      const tournament = await addTournament(title, user ? user.id : null, "elimination");
      if (!tournament || !tournament.id) {
        throw new Error("Turnuva oluşturulamadı: Supabase veri dönmedi!");
      }
      setTournamentId(tournament.id);
    } catch (error) {
      alert("Turnuva kaydedilemedi: " + error.message);
    }

  };

  const handleIsimChange = (idx, val) => {
    const yeni = [...isimler];
    yeni[idx] = val;
    setIsimler(yeni);
  };

  const handleGruplaraAyir = async () => {
    if (isimler.some((x) => !x.trim())) {
      alert("Tüm isimleri doldurun!");
      return;
    }
    let playerIds = [];
    for (const name of isimler) {
      try {
        const player = await addPlayer(name);
        playerIds.push(player.id);
        await addTournamentPlayer(tournamentId, player.id);
      } catch (error) {
        alert("Oyuncu eklenemedi: " + error.message);
      }
    }
    const gruplarYeni = gruplaraAyir(isimler);
    setGruplar(gruplarYeni);
    const fiksturler = gruplarYeni.map(grup => generateRoundRobinFixtures(grup));
    setGrupFiksturleri(fiksturler);
    setGrupSkorlar(Array(gruplarYeni.length).fill({}));
    setShowTablo(Array(gruplarYeni.length).fill(false));
  };

  const handleSkorChange = (grupIdx, haftaIdx, macIdx, takim, val) => {
    setGrupSkorlar(prev => {
      const yeni = [...prev];
      yeni[grupIdx] = {
        ...yeni[grupIdx],
        [`${haftaIdx}_${macIdx}_${takim}`]: val
      };
      return yeni;
    });
  };

  const toggleTablo = grupIdx => {
    setShowTablo(prev => {
      const yeni = [...prev];
      yeni[grupIdx] = !yeni[grupIdx];
      return yeni;
    });
  };

  const tumSkorlarGirildiMi = () => {
    for (let grupIdx = 0; grupIdx < gruplar.length; grupIdx++) {
      const fikstur = grupFiksturleri[grupIdx];
      const skorlar = grupSkorlar[grupIdx];
      if (!fikstur || !skorlar) return false;
      for (let haftaIdx = 0; haftaIdx < fikstur.length; haftaIdx++) {
        for (let macIdx = 0; macIdx < fikstur[haftaIdx].length; macIdx++) {
          const s1 = skorlar[`${haftaIdx}_${macIdx}_1`];
          const s2 = skorlar[`${haftaIdx}_${macIdx}_2`];
          if (s1 === undefined || s1 === "" || s2 === undefined || s2 === "") {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleGruplarBitti = () => {
    if (!tumSkorlarGirildiMi()) {
      alert("Tüm gruplardaki maç skorlarını girmelisiniz!");
      return;
    }
    let ilkIkiler = [];
    gruplar.forEach((grup, grupIdx) => {
      const tablo = puanTablosuHesapla(grup, grupSkorlar[grupIdx], grupFiksturleri[grupIdx]);
      ilkIkiler.push(...tablo.slice(0, 2));
    });
    const ustTurOyuncuIsimleri = ilkIkiler.map(o => o.name);
    const { eslesmelerYeni, bye } = otomatikEslestir(ustTurOyuncuIsimleri);
    setUstTurOyuncular(ustTurOyuncuIsimleri);
    setElemeEslesmeleri(eslesmelerYeni);
    setElemeBye(bye);
    setElemeyeGec(true);
  };

  return (
    <div className="elemination-container">
      {!elemeyeGec ? (
        <>
          <div className="elemination-header">
            <img src={trophy} alt="trophy" />
            <span>TURNUVA</span>
          </div>
          <h2 className="elemination-title">Gruplu Turnuva</h2>
          {!isimler.length && (
            <>
              <label className="elemination-label">Turnuva Adı:</label>
              <input
                className="elemination-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Turnuva adı giriniz"
              />
              <label className="elemination-label">Oyuncu Sayısı (4'ün katı):</label>
              <input
                className="elemination-input"
                type="number"
                min={4}
                step={4}
                value={oyuncuSayisi}
                onChange={e => setOyuncuSayisi(e.target.value)}
                placeholder="Oyuncu sayısı (4, 8, 12...)"
              />
              <button className="elemination-btn" onClick={handleIsimGir}>İsimleri Gir</button>
            </>
          )}
          {isimler.length > 0 && !gruplar.length && (
            <div>
              {isimler.map((isim, idx) => (
                <div key={idx}>
                  <input
                    className="elemination-input"
                    type="text"
                    placeholder={`${idx + 1}. Oyuncu'nun Adı`}
                    value={isim}
                    onChange={e => handleIsimChange(idx, e.target.value)}
                  />
                </div>
              ))}
              <button className="elemination-btn" onClick={handleGruplaraAyir}>Gruplara Ayır</button>
            </div>
          )}
          {gruplar.length > 0 && (
            <div>
              <h2 className="elemination-title">Gruplar ve Maçlar</h2>
              {gruplar.map((grup, grupIdx) => (
                <div key={grupIdx} style={{ marginBottom: 32, background: "rgba(90,255,200,0.08)", borderRadius: 12, padding: 12 }}>
                  <h3 className="elemination-label">Grup {grupIdx + 1}</h3>
                  <div>
                    <strong>Oyuncular:</strong> {grup.join(" - ")}
                  </div>
                  {grupFiksturleri[grupIdx] && grupFiksturleri[grupIdx].map((hafta, haftaIdx) => (
                    <div key={haftaIdx} style={{ marginBottom: 18 }}>
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
                              value={grupSkorlar[grupIdx]?.[`${haftaIdx}_${macIdx}_1`] || ""}
                              onChange={e => handleSkorChange(grupIdx, haftaIdx, macIdx, 1, e.target.value)}
                            />
                          </div>
                          <span className="elemination-vs" style={{ fontWeight: 'bold' }}>VS</span>
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <input
                              className="elemination-score-input"
                              type="number"
                              min={0}
                              style={{ width: '70px', marginRight: '10px' }}
                              value={grupSkorlar[grupIdx]?.[`${haftaIdx}_${macIdx}_2`] || ""}
                              onChange={e => handleSkorChange(grupIdx, haftaIdx, macIdx, 2, e.target.value)}
                            />
                            <label className="elemination-label" style={{ minWidth: '100px', textAlign: 'left' }}>
                              {mac.dep}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button
                    className="elemination-btn"
                    style={{ marginTop: 7, marginRight: 16 }}
                    onClick={() => toggleTablo(grupIdx)}
                  >
                    {showTablo[grupIdx] ? "Tabloyu Gizle" : "Puan Tablosu Göster"}
                  </button>
                  {showTablo[grupIdx] && (
                    <PuanTablosu
                      tablo={puanTablosuHesapla(
                        grup,
                        grupSkorlar[grupIdx],
                        grupFiksturleri[grupIdx]
                      )}
                    />
                  )}
                </div>
              ))}
              <button
                className="elemination-btn"
                style={{ marginTop: 16, marginRight: 16 }}
                onClick={handleGruplarBitti}
                disabled={!tumSkorlarGirildiMi()}
              >
                Gruplar Bitti - Eleme Sistemine Geç
              </button>
            </div>
          )}
        </>
      ) : (
        <Elemination
          otomatikEslesmeler={elemeEslesmeleri}
          otomatikBye={elemeBye}
          isimler={ustTurOyuncular}
          otomatikBaslat={true}
          tournamentId={tournamentId}
        />
      )}
    </div>
  );
};

export default Group;