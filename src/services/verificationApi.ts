import type { FavoriteItem, VerificationResponse } from '../types/verification';
import type { GeoLocation } from '../types/weather';

const API_BASE =
  typeof window !== 'undefined' && window.location.hostname === '100.115.154.44'
    ? '/api'
    : 'http://100.115.154.44:8085/api';

export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const res = await fetch(`${API_BASE}/favorites`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Error fetching favorites from server:', err);
    return [];
  }
}

export async function addFavorite(loc: GeoLocation): Promise<FavoriteItem | null> {
  try {
    const res = await fetch(`${API_BASE}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        country: loc.country || loc.admin1 || '',
        timezone: loc.timezone || 'auto'
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('Error adding favorite:', err);
    alert(`Impossibile aggiungere ai preferiti: ${err.message}`);
    return null;
  }
}

export async function removeFavorite(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/favorites/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting favorite:', err);
    return false;
  }
}

export async function getVerificationData(
  favoriteId: number,
  pastDays: number = 2,
  futureDays: number = 3
): Promise<VerificationResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/verification/${favoriteId}?past_days=${pastDays}&future_days=${futureDays}`
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching verification data:', err);
    return null;
  }
}

export async function triggerManualSync(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error triggering manual sync:', err);
    return null;
  }
}
