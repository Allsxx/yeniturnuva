import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";

import {
  addPlayer,
  addTournament,
  addTournamentPlayer,
  addMatch,
} from "../supabaseService";
import click1 from "../assets/click1.mp3";
import trophy from "../assets/trophy.ico";

const Elemination = ({
  otomatikEslesmeler,
  otomatikBye,
  isimler: gelenIsimler,
  otomatikBaslat = false,
  tournamentId: gelenTournamentId
}) => {
  
  const [title, setTitle] = useState("");
  const [yarismaciSayisi, setYarismaciSayisi] = useState("");
  const [isimler, setIsimler] = useState([]);
  const [eslesmeler, setEslesmeler] = useState([]);
  const [byeOyuncu, setByeOyuncu] = useState("");
  const [skorlar, setSkorlar] = useState({});
  const [kazanan, setKazanan] = useState("");
  const [showSonuclar, setShowSonuclar] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);

  const { user } = useContext(UserContext);
  const navigate = useNavigate();
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

  
  useEffect(() => {
    if (otomatikBaslat && gelenIsimler && gelenIsimler.length > 0) {
      setIsimler(gelenIsimler);
      setShowSonuclar(true);
      if (otomatikEslesmeler) {
        const temp = gelenIsimler.map((name) => ({ name }));
        const findObj = (name) => temp.find((o) => o.name === name) || { name };
        const eslesmeObj = otomatikEslesmeler.map(([a, b]) => [findObj(a), findObj(b)]);
        setEslesmeler(eslesmeObj);
      }
      if (otomatikBye) {
        setByeOyuncu({ name: otomatikBye });
      }
      if (gelenTournamentId) setTournamentId(gelenTournamentId);
    }
  }, [otomatikBaslat, gelenIsimler, otomatikEslesmeler, otomatikBye, gelenTournamentId]);

  

  
  const handleIsimGir = async () => {
    if (!yarismaciSayisi || yarismaciSayisi < 2) {
      alert("En az 2 yarışmacı olmalı!");
      return;
    }
    if (!title.trim()) {
      alert("Turnuva adı giriniz!");
      return;
    }
    setIsimler(Array(parseInt(yarismaciSayisi)).fill(""));
    setKazanan("");
    setEslesmeler([]);
    setByeOyuncu("");
    setSkorlar({});
    setShowSonuclar(false);

    try {
      if (user) {
        try {
          const tournament = await addTournament(title, user.id, "elimination");
          if (!tournament || !tournament.id) {
            throw new Error("Turnuva oluşturulamadı: Supabase veri dönmedi!");
          }
          setTournamentId(tournament.id);
        } catch (error) {
          
        }
      } else {
        
        setTournamentId(null);
      }

      if (!tournament || !tournament.id) {
        throw new Error("Turnuva oluşturulamadı: Supabase veri dönmedi!");
      }
      setTournamentId(tournament.id);
    } catch (error) {
      
    }

  };

  
  const handleIsimChange = (idx, val) => {
    const yeni = [...isimler];
    yeni[idx] = val;
    setIsimler(yeni);
  };

  
  const handleEslestirme = async () => {

    if (isimler.some((x) => !x.trim())) {
      alert("Tüm isimleri doldurun!");
      return;
    }
    const playerIds = [];
    for (const name of isimler) {
      if (user) {
        try {
          const player = await addPlayer(name);
          playerIds.push(player.id);
          await addTournamentPlayer(tournamentId, player.id);
        } catch (error) {
          alert("Oyuncu eklenemedi: " + error.message);
        }
      } else {
        
        playerIds.push(name);
      }
    }

    otomatikEslestir(playerIds, isimler);
  };

  
  const otomatikEslestir = (playerIds, isimlerList) => {
    const temp = playerIds.map((id, i) => ({ id, name: isimlerList[i] }));
    const karisik = [...temp].sort(() => Math.random() - 0.5);
    const eslesmelerYeni = [];
    let bye = null;
    for (let i = 0; i < karisik.length - 1; i += 2) {
      eslesmelerYeni.push([karisik[i], karisik[i + 1]]);
    }
    if (karisik.length % 2 === 1) {
      bye = karisik[karisik.length - 1];
    }
    setEslesmeler(eslesmelerYeni);
    setByeOyuncu(bye);
    setSkorlar({});
    setShowSonuclar(true);
  };

  
  const handleSkorChange = (idx, oyuncu, val) => {
    setSkorlar((prev) => ({
      ...prev,
      [`${idx}_${oyuncu}`]: val
    }));
  };

  
  const handleSonuclar = async () => {

    let yeniTurKazananlari = [];
    let yeniTurOyuncular = [];
    let eksik = false;
    let beraberlik = false;
    let round = 1;

    for (let idx = 0; idx < eslesmeler.length; idx++) {
      const pair = eslesmeler[idx];
      let s1 = parseInt(skorlar[`${idx}_1`]);
      let s2 = parseInt(skorlar[`${idx}_2`]);
      if (isNaN(s1) || isNaN(s2)) {
        eksik = true;
        continue;
      }
      let winner = null;
      if (s1 > s2) winner = pair[0];
      else if (s2 > s1) winner = pair[1];
      else beraberlik = true;

      if (winner) {
        yeniTurKazananlari.push(winner.id || winner.name);
        yeniTurOyuncular.push(winner.name);
      }

      try {
        await addMatch({
          tournament_id: tournamentId,
          round: round,
          player1_id: pair[0].id,
          player2_id: pair[1].id,
          player1_score: s1,
          player2_score: s2,
          winner_id: winner ? (winner.id || null) : null,
          is_bye: false
        });
      } catch (error) {
        alert("Maç kaydedilemedi: " + error.message);
      }
    }

    
    if (byeOyuncu && byeOyuncu.name) {
      yeniTurKazananlari.push(byeOyuncu.id || byeOyuncu.name);
      yeniTurOyuncular.push(byeOyuncu.name);
      try {
        await addMatch({
          tournament_id: tournamentId,
          round: round,
          player1_id: byeOyuncu.id,
          player2_id: null,
          player1_score: null,
          player2_score: null,
          winner_id: byeOyuncu.id || byeOyuncu.name,
          is_bye: true
        });
      } catch (error) {
        alert("Bye kaydedilemedi: " + error.message);
      }
    }

    if (eksik) return alert("Tüm skorları girin.");
    if (beraberlik) return alert("Beraberlik var, bir kazanan belirleyin.");

    if (yeniTurKazananlari.length === 1) {
      setKazanan(yeniTurOyuncular[0]);
      setEslesmeler([]);
      setByeOyuncu("");
      setShowSonuclar(false);
    } else {
      
      setIsimler(yeniTurOyuncular);
      otomatikEslestir(yeniTurKazananlari, yeniTurOyuncular);
    }
  };

  const otomatikMod = otomatikBaslat && gelenIsimler && gelenIsimler.length > 0;

  
  return (
    <div className="elemination-container">
      <div className="elemination-header">
        <img src={trophy} alt="trophy" />
        <span>TURNUVA</span>
      </div>
      <h2 className="elemination-title">Eleme Turnuvası</h2>
      {/* Başlangıç: turnuva adı ve yarışmacı sayısı */}
      {!otomatikMod && (
        <>
          <label className="elemination-label">Turnuva Adı:</label>
          <input
            className="elemination-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Turnuva adı giriniz"
          />
          <label className="elemination-label">Yarışmacı Sayısı:</label>
          <input
            className="elemination-input"
            type="number"
            min={2}
            value={yarismaciSayisi}
            onChange={e => setYarismaciSayisi(e.target.value)}
          />
          <button className="elemination-btn" onClick={handleIsimGir}>İsimleri Gir</button>
        </>
      )}
      {/* Oyuncu isimleri girilir */}
      {!otomatikMod && isimler.length > 0 && !eslesmeler.length && !kazanan && (
        <div>
          {isimler.map((isim, idx) => (
            <div key={idx}>
              <input
                className="elemination-input"
                type="text"
                placeholder={`${idx + 1}. Yarışmacı'nın Adı`}
                value={isim}
                onChange={e => handleIsimChange(idx, e.target.value)}
              />
            </div>
          ))}
          <button className="elemination-btn" onClick={handleEslestirme}>Eşleştir</button>
        </div>
      )}
      {/* Eşleşmeler ve skor girişi */}
      {eslesmeler.length > 0 && (
        <div>
          <h2 className="elemination-title">Eşleştirme Sonuçları</h2>
          {eslesmeler.map((pair, idx) => (
            <div key={idx} className="elemination-match" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <label className="elemination-label" style={{ minWidth: '100px', textAlign: 'right' }}>
                  {pair[0].name}
                </label>
                <input
                  className="elemination-score-input"
                  type="number"
                  min={0}
                  style={{ width: '70px', }}
                  value={skorlar[`${idx}_1`] || ""}
                  onChange={e => handleSkorChange(idx, 1, e.target.value)}
                />
              </div>
              <span className="elemination-vs" style={{ fontWeight: 'bold' }}>VS</span>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <input
                  className="elemination-score-input"
                  type="number"
                  min={0}
                  style={{ width: '70px', marginRight: '10px' }}
                  value={skorlar[`${idx}_2`] || ""}
                  onChange={e => handleSkorChange(idx, 2, e.target.value)}
                />
                <label className="elemination-label" style={{ minWidth: '100px', textAlign: 'left' }}>
                  {pair[1].name}
                </label>
              </div>
            </div>
          ))}
          {byeOyuncu && byeOyuncu.name && (
            <div className="elemination-match" style={{ background: "rgba(90,255,200,0.12)" }}>
              <span className="elemination-label">{byeOyuncu.name} bu turu bay geçti (otomatik üst turda)</span>
            </div>
          )}
          {showSonuclar && (
            <button className="elemination-btn" onClick={handleSonuclar}>Sonuçları Gir</button>
          )}
        </div>
      )}
      {/* Şampiyon */}
      {kazanan && (
        <div className="elemination-winner-box">
          <span className="elemination-winner-name">🏆 {kazanan} Şampiyon Oldu!</span>
        </div>
      )}
    </div>
  );
};

export default Elemination;