import { supabase } from './supabaseClient';






export async function deleteTournament(tournamentId) {
  
  await supabase
    .from('tournament_players')
    .delete()
    .eq('tournament_id', tournamentId);

  await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId);

  
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournamentId);

  if (error) throw error;
  return { success: true };
}


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
}
export async function addPlayer(name) {
  
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('name', name)
    .single();

  if (existing) return existing; 

  
  const { data, error } = await supabase
    .from('players')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Oyuncu eklenemedi: Veri alınamadı.");
  return data;
}


export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*');
  if (error) throw error;
  return data;
}


export async function addTournament(title, owner, type) {
  const { data, error } = await supabase
    .from('tournaments')
    .insert([{ title, owner, type }])
    .select() 
    .single(); 

  console.log("addTournament result:", { data, error });
  if (error) throw error;
  if (!data) throw new Error("Turnuva oluşturulamadı: Veri alınamadı.");
  return data;
}


export async function addTournamentPlayer(tournament_id, player_id) {
  const { data, error } = await supabase
    .from('tournament_players')
    .insert([{ tournament_id, player_id }])
    .single();
  if (error) throw error;
  return data;
}


export async function addMatch(matchObj) {
  const { data, error } = await supabase
    .from('matches')
    .insert([matchObj])
    .single();
  if (error) throw error;
  return data;
}


export async function getMatches(tournament_id) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournament_id);
  if (error) throw error;
  return data;
}


export async function getTournament(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}