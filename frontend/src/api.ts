export async function searchBeers(query: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/beers/search?name=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch beers');
  return res.json();
}

export async function getList(token?: string, category?: string) {
  let url = `${import.meta.env.VITE_API_URL}/user/lists`;
  if (category) {
    url += `?category=${encodeURIComponent(category)}`;
  }
  const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new Error('Failed to fetch user list');
  return res.json();
}

export async function addBeerToList(beer_id: string, list_type: string, token?: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/user/lists/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ beer_id, list_type }),
  });
  if (!res.ok) throw new Error('Failed to add beer to list');
  return res.json();
}

export async function updateElo(list_type: string, winner_id: string, loser_id: string, token?: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/user/lists/${list_type}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ winner_id, loser_id }),
  });
  if (!res.ok) throw new Error('Failed to update Elo');
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
} 