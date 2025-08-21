import { supabase } from './supabaseClient';



// supabaseService.js'e bu fonksiyonları ekleyin

// Turnuvayı sil
export async function deleteTournament(tournamentId) {
  // Önce ilişkili kayıtları sil (turnnament_players ve matches)
  await supabase
    .from('tournament_players')
    .delete()
    .eq('tournament_id', tournamentId);

  await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId);

  // Sonra turnuvayı sil
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournamentId);

  if (error) throw error;
  return { success: true };
}

// Turnuva detaylarını getir (oyuncularla birlikte)
export async function getTournamentWithPlayers(id) {
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (tournamentError) throw tournamentError;

  const { data: players, error: playersError } = await supabase
    .from('tournament_players')
    .select('player_id')
    .eq('tournament_id', id);

  if (playersError) throw playersError;

  return { ...tournament, player_ids: players.map(p => p.player_id) };
}// Oyuncu ekle
export async function addPlayer(name) {
  // Aynı isim varsa ekleme!
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('name', name)
    .single();

  if (existing) return existing; // varsa o kaydı döndür

  // Yoksa ekle
  const { data, error } = await supabase
    .from('players')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Oyuncu eklenemedi: Veri alınamadı.");
  return data;
}

// Oyuncuları getir
export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*');
  if (error) throw error;
  return data;
}

// Turnuva ekle (type parametresi eklendi)
export async function addTournament(title, owner, type) {
  const { data, error } = await supabase
    .from('tournaments')
    .insert([{ title, owner, type }])
    .select() // Eklenen veriyi geri döndürür
    .single(); // Tek bir kayıt döndürür

  console.log("addTournament result:", { data, error });
  if (error) throw error;
  if (!data) throw new Error("Turnuva oluşturulamadı: Veri alınamadı.");
  return data;
}

// Turnuva oyuncusu ekle
export async function addTournamentPlayer(tournament_id, player_id) {
  const { data, error } = await supabase
    .from('tournament_players')
    .insert([{ tournament_id, player_id }])
    .single();
  if (error) throw error;
  return data;
}

// Maç ekle
export async function addMatch(matchObj) {
  const { data, error } = await supabase
    .from('matches')
    .insert([matchObj])
    .single();
  if (error) throw error;
  return data;
}

// Turnuvadaki maçları getir
export async function getMatches(tournament_id) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournament_id);
  if (error) throw error;
  return data;
}

// Turnuva detaylarını getir
export async function getTournament(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}