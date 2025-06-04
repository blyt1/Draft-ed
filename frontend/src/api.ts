const API_BASE = '';

export async function searchBeers(query: string, beerType?: string) {
  let url = `/beers/search?q=${encodeURIComponent(query)}`;
  if (beerType) {
    url += `&beer_type=${encodeURIComponent(beerType)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch beers');
  return res.json();
}

export async function getBeerById(id: string) {
  const res = await fetch(`/beers/${id}`);
  if (!res.ok) throw new Error('Failed to fetch beer');
  return res.json();
}

export async function getUserLists(token?: string) {
  const res = await fetch(`/user/lists`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  } as RequestInit);
  if (!res.ok) throw new Error('Failed to fetch user lists');
  return res.json();
}

export async function getList(token?: string, category?: string) {
  const listName = category || 'All Beers';
  let url = `/user/lists/${encodeURIComponent(listName)}`;
  if (category && category !== 'All Beers') {
    url += `?beer_type=${encodeURIComponent(category)}`;
  }
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  } as RequestInit);
  
  if (!res.ok) {
    if (res.status === 404) {
      // List doesn't exist yet, return empty structure
      return {
        _id: null,
        user_id: null,
        name: listName,
        beers: [],
        created_at: new Date().toISOString()
      };
    }
    throw new Error('Failed to fetch user list');
  }
  return res.json();
}

export async function addBeerToList(beer_id: string, list_name: string, token?: string) {
  const res = await fetch(`/user/lists/${encodeURIComponent(list_name)}/beers/${beer_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to add beer to list');
  return res.json();
}

export async function updateElo(list_name: string, beer1_id: string, beer2_id: string, winner_id: string, token?: string) {
  const res = await fetch(`/user/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      beer1_id,
      beer2_id,
      winner_id,
      list_name
    })
  });
  if (!res.ok) throw new Error('Failed to update Elo');
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}

export async function addBeer(beerData: {
  name: string;
  brewery: string;
  type: string;
  abv?: string;
  ibu?: string;
  description?: string;
}) {
  const token = localStorage.getItem('token');
  const res = await fetch('/beers/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      ...beerData,
      abv: beerData.abv ? parseFloat(beerData.abv) : undefined,
      ibu: beerData.ibu ? parseInt(beerData.ibu) : undefined
    })
  });
  if (!res.ok) throw new Error('Failed to add beer');
  return res.json();
} 