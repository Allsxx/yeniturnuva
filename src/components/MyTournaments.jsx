import React, { useState, useEffect, useContext } from "react";
import { supabase } from "../supabaseClient";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";
import { deleteTournament } from "../supabaseService";

function MyTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
  }, [user]);

  const fetchTournaments = async () => {
    if (!user) {
      setTournaments([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("owner", user.id)
      .order('created_at', { ascending: false });

    if (error) {
      alert("Turnuva verisi alınamadı: " + error.message);
      setTournaments([]);
    } else {
      setTournaments(data);
    }
    setLoading(false);
  };

  const handleDeleteTournament = async (tournamentId, tournamentTitle) => {
    
    if (!window.confirm(`"${tournamentTitle}" turnuvasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    setDeletingId(tournamentId);

    try {
      await deleteTournament(tournamentId);
      alert("Turnuva başarıyla silindi!");

      
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
    } catch (error) {
      alert("Turnuva silinirken hata oluştu: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Geçmiş Turnuvalarım</h2>

      {tournaments.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#a6a6a6ff',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <p>Hiç turnuva oluşturmadınız.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              fontWeight: 'bold',
              fontSize: '16px',
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#c3c8cdff',
              color: '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Yeni Turnuva Başlat
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tournaments.map(t => (
          <li key={t.id} style={{
        boxShadow:"0 0 15px rgba(255, 255, 255, 0.9)",
        color: '#333',
        marginBottom: 18,
        background: "#c3c8cdff",
        padding: 16,
        borderRadius: 10,
        position: 'relative'
          }}>
        <strong style={{ fontSize: '18px', display: 'block', marginBottom: '8px' }}>
          {t.title}
        </strong>
        <div style={{ marginBottom: '5px' }}>
          <strong>Tip:</strong> {
            t.type === 'league' ? 'Lig' :
              t.type === 'group' ? 'Gruplu' : 'Eleme'
          }
        </div>
        <div style={{ marginBottom: '5px' }}>
          <strong>Oluşturulma:</strong> {new Date(t.created_at).toLocaleString('tr-TR')}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Turnuva ID:</strong> {t.id}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/tournament/${t.id}`)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Detayları Gör
          </button>

          <button
            onClick={() => handleDeleteTournament(t.id, t.title)}
            disabled={deletingId === t.id}
            style={{
              padding: '8px 16px',
              backgroundColor: deletingId === t.id ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: deletingId === t.id ? 'not-allowed' : 'pointer'
            }}
          >
            {deletingId === t.id ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </li>
        ))}
    </ul>
    </div >
  );
}

export default MyTournaments;