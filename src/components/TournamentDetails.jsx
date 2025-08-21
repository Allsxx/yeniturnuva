import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMatches, getPlayers, getTournament } from "../supabaseService";
import trophy from "../assets/trophy.ico";

// Lig turnuvası için puan tablosu hesaplama fonksiyonu
function calculateLeagueStandings(matches, players) {
  const PUAN_KAZAN = 3;
  const PUAN_BERABERE = 1;
  
  // Tüm oyuncuları içeren bir tablo oluştur
  let tablo = {};
  Object.values(players).forEach(name => {
    tablo[name] = {
      name,
      O: 0, G: 0, B: 0, M: 0, A: 0, Y: 0, AV: 0, P: 0
    };
  });

  // Maçları işle
  matches.forEach(match => {
    const player1Name = players[match.player1_id];
    const player2Name = players[match.player2_id];
    
    if (!player1Name || !player2Name) return;
    
    const s1 = match.player1_score;
    const s2 = match.player2_score;
    
    if (s1 === null || s2 === null) return;
    
    const evTablo = tablo[player1Name];
    const depTablo = tablo[player2Name];
    
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
  
  // Sırala (en yüksek puan en üstte)
  const sortedTable = Object.values(tablo).sort((a, b) => 
    b.P - a.P || b.AV - a.AV || b.A - a.A
  );
  
  return sortedTable;
}

function TournamentDetail() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [kazanan, setKazanan] = useState("");
  const [leagueStandings, setLeagueStandings] = useState([]);

  useEffect(() => {
    async function fetchTournament() {
      try {
        const tournamentData = await getTournament(id);
        setTournament(tournamentData);
      } catch (error) {
        alert("Turnuva verisi alınamadı: " + error.message);
        setTournament(null);
      }
    }

    async function fetchDetails() {
      try {
        const matchesData = await getMatches(id);
        const allPlayerIds = new Set();
        
        matchesData.forEach(m => {
          if (m.player1_id) allPlayerIds.add(m.player1_id);
          if (m.player2_id) allPlayerIds.add(m.player2_id);
          if (m.winner_id) allPlayerIds.add(m.winner_id);
        });

        const allPlayersArray = await getPlayers();
        const playersMap = {};
        
        allPlayersArray.forEach(p => {
          playersMap[p.id] = p.name;
        });

        setMatches(matchesData);
        setPlayers(playersMap);

        // Turnuva tipine göre kazananı belirle
        if (tournament?.type === "league") {
          // Lig turnuvası: puan tablosuna göre kazanan
          const standings = calculateLeagueStandings(matchesData, playersMap);
          setLeagueStandings(standings);
          
          if (standings.length > 0) {
            setKazanan(standings[0].name); // En yüksek puanlı oyuncu
          }
        } else {
          // Eleme veya gruplu turnuva: son maçın kazananı
          if (matchesData && matchesData.length > 0) {
            const lastMatch = matchesData[matchesData.length - 1];
            if (lastMatch.winner_id && playersMap[lastMatch.winner_id]) {
              setKazanan(playersMap[lastMatch.winner_id]);
            } else {
              setKazanan(lastMatch.winner_id || "Belirlenmedi");
            }
          }
        }
      } catch (error) {
        alert("Detaylar alınamadı: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTournament();
    fetchDetails();
  }, [id, tournament?.type]);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: 650, margin: "40px auto" }}>
      <h2>Turnuva Detayı</h2>
      <div>
        <img src={trophy} alt="trophy" style={{ width: 50 }} />
        <span className="history-title">
          <strong>Turnuva Adı:</strong> {tournament?.title || "?"}
        </span>
        <div><span className="history-title"><strong>Turnuva Tipi:</strong> {
            tournament?.type === "league" ? "Lig" : 
            tournament?.type === "group" ? "Gruplu" : "Eleme"
          }</span>
        </div>
      </div>
      <hr />
      
      {/* Lig turnuvasıysa puan tablosunu göster */}
      {tournament?.type === "league" && leagueStandings.length > 0 && (
        <>
          <h3>Puan Tablosu</h3>
          <table style={{ width: "100%", marginBottom: "20px", borderCollapse: "collapse" }}>
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
              {leagueStandings.map((row, i) => (
                <tr key={row.name} style={{ 
                  backgroundColor: i === 0 ? "#f0f8ff" : "transparent",
                  fontWeight: i === 0 ? "bold" : "normal"
                }}>
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
          <hr />
        </>
      )}
      
      <h3>Oynanan Maçlar</h3>
      <ol>
        {matches.map(m => (
          <li className="history" key={m.id} style={{ marginBottom: 12 }}>
            {players[m.player1_id] || m.player1_id}
            {" vs "}
            {m.player2_id ? (players[m.player2_id] || m.player2_id) : "(Bay geçti)"}
            {" — "}
            {m.player1_score} : {m.player2_score}
            {" | Kazanan: "}
            {m.winner_id ? (players[m.winner_id] || m.winner_id) : "-"}
            <hr />
          </li>
        ))}
      </ol>
      <hr />
      <h3>Şampiyon: {kazanan ? kazanan : "Henüz şampiyon yok"}</h3>
    </div>
  );
}

export default TournamentDetail;