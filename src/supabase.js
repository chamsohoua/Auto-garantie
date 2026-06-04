import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL      = '';
const SUPABASE_ANON_KEY = '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },

  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
    },
  },
});


export async function fetchListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, brand, model, version, engine, year,
      mileage, fuel_type, price_dzd, wilaya,
      description, car_images, status, views_count, created_at, user_id,
      inspections (
        hood_damaged, front_bumper_damaged, rear_bumper_damaged,
        front_left_fender_damaged, front_right_fender_damaged,
        left_door_damaged, right_door_damaged,
        rear_left_door_damaged, rear_right_door_damaged,
        roof_damaged, trunk_damaged,
        windshield_damaged, rear_windshield_damaged,
        damage_details, condition_score
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60);   


  if (error) throw error;
  return data;
}

export async function fetchListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, brand, model, version, engine, year,
      mileage, fuel_type, price_dzd, wilaya,
      description, car_images, status, views_count, created_at, user_id,
      inspections (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserListings(userId) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, brand, model, version, year, engine,
      mileage, fuel_type, price_dzd, wilaya,
      car_images, status, views_count, created_at,
      inspections ( condition_score )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}

export async function insertListing(listing) {
  const { data, error } = await supabase
    .from('listings')
    .insert(listing)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertInspection(inspection) {
  const { data, error } = await supabase
    .from('inspections')
    .insert(inspection)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function incrementViews(id) {
  await supabase.rpc('increment_views', { listing_id: id });
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
