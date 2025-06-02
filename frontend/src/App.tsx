import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { searchBeers, getList, addBeerToList, updateElo, login, register } from './api'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'

interface Beer {
  _id: string;
  name: string;
  brewery?: string;
  type?: string;
  abv?: string;
  ibu?: string;
  description?: string;
}

interface BeerInList extends Beer {
  beer_id?: string; // for backend compatibility
  elo_score: number;
}

const DEFAULT_LIST_TYPE = 'All Beers';
const LIST_TYPES = [
  'All Beers',
  'Double IPA',
  'Stout',
  'Pale Ale',
  'Witbier',
  'Sour',
  'Lager',
  'Ale',
  // Add more as needed
];

async function fetchBeerDetails(beerInList: any): Promise<BeerInList> {
  const id = beerInList.beer_id || beerInList._id;
  try {
    const res = await fetch(`/beers/${id}`);
    if (!res.ok) return { ...beerInList, _id: id };
    const beer = await res.json();
    return { ...beer, elo_score: beerInList.elo_score, beer_id: id };
  } catch {
    return { ...beerInList, _id: id };
  }
}

function AddBeerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    brewery: '',
    type: '',
    abv: '',
    ibu: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/beers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to add beer');
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Add a New Beer</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md flex flex-col gap-3">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required className="border rounded px-2 py-1" />
        <input name="brewery" value={form.brewery} onChange={handleChange} placeholder="Brewery" className="border rounded px-2 py-1" />
        <input name="type" value={form.type} onChange={handleChange} placeholder="Type (e.g. IPA)" className="border rounded px-2 py-1" />
        <input name="abv" value={form.abv} onChange={handleChange} placeholder="ABV" className="border rounded px-2 py-1" />
        <input name="ibu" value={form.ibu} onChange={handleChange} placeholder="IBU" className="border rounded px-2 py-1" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border rounded px-2 py-1" />
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-amber-700 text-white px-4 py-2 rounded" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Beer'}
        </button>
        <button type="button" className="text-blue-700 underline mt-2" onClick={() => navigate('/')}>Cancel</button>
      </form>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      localStorage.setItem('token', res.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md flex flex-col gap-3">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="border rounded px-2 py-1" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="border rounded px-2 py-1" />
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-amber-700 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <button type="button" className="text-blue-700 underline mt-2" onClick={() => navigate('/register')}>Register</button>
      </form>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register(username, email, password);
      localStorage.setItem('token', res.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md flex flex-col gap-3">
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="border rounded px-2 py-1" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="border rounded px-2 py-1" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="border rounded px-2 py-1" />
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-amber-700 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        <button type="button" className="text-blue-700 underline mt-2" onClick={() => navigate('/login')}>Back to Login</button>
      </form>
    </div>
  );
}

function MainApp() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Beer[]>([]);
  const [myList, setMyList] = useState<BeerInList[]>([]);
  const [compareQueue, setCompareQueue] = useState<BeerInList[]>([]);
  const [candidate, setCandidate] = useState<BeerInList | null>(null);
  const [comparing, setComparing] = useState<BeerInList | null>(null);
  const navigate = useNavigate();
  const [selectedListType, setSelectedListType] = useState<string>(DEFAULT_LIST_TYPE);

  // Load list from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    const category = selectedListType !== 'All Beers' ? selectedListType : undefined;
    getList(token, category).then(async (lists) => {
      const found = lists[0];
      if (found && found.beers.length > 0) {
        const beersWithDetails = await Promise.all(
          found.beers.map(fetchBeerDetails)
        );
        setMyList(beersWithDetails);
      } else {
        setMyList([]);
      }
    }).catch(() => setMyList([]));
  }, [selectedListType]);

  // Search beers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const beers = await searchBeers(query);
    setResults(beers);
  };

  // Add beer to list (always to 'All Beers')
  const handleAdd = async (beer: Beer) => {
    const token = localStorage.getItem('token') || undefined;
    const existingBeer = myList.find(b => b._id === beer._id || b.beer_id === beer._id);
    if (myList.length === 0 && selectedListType === 'All Beers') {
      await addBeerToList(beer._id, 'All Beers', token);
      const beerWithDetails = await fetchBeerDetails({ beer_id: beer._id, elo_score: 1200 });
      setMyList([beerWithDetails]);
    } else if (selectedListType === 'All Beers') {
      const initialElo = existingBeer ? existingBeer.elo_score : 1200;
      setCandidate({ ...beer, elo_score: initialElo });
      setCompareQueue(myList.filter(b => b._id !== beer._id && b.beer_id !== beer._id));
      setComparing(myList.filter(b => b._id !== beer._id && b.beer_id !== beer._id)[0]);
    } else {
      alert('You can only add beers to the master list (All Beers). Switch to All Beers to add.');
    }
  };

  // Handle pairwise comparison result
  const handleCompare = async (winner: 'candidate' | 'list') => {
    if (!candidate || !comparing) return;
    const token = localStorage.getItem('token') || undefined;
    const k = 32;
    let candidateElo = candidate.elo_score;
    let listElo = comparing.elo_score;
    const expectedCandidate = 1 / (1 + 10 ** ((listElo - candidateElo) / 400));
    const expectedList = 1 / (1 + 10 ** ((candidateElo - listElo) / 400));
    let winner_id = winner === 'candidate' ? candidate._id : comparing._id;
    let loser_id = winner === 'candidate' ? comparing._id : candidate._id;
    await updateElo('All Beers', winner_id, loser_id, token);
    if (winner === 'candidate') {
      candidateElo += Math.round(k * (1 - expectedCandidate));
      listElo += Math.round(k * (0 - (1 - expectedCandidate)));
    } else {
      candidateElo += Math.round(k * (0 - expectedList));
      listElo += Math.round(k * (1 - expectedList));
    }
    setMyList((prev) =>
      prev.map((b) =>
        b._id === comparing._id || b.beer_id === comparing._id ? { ...b, elo_score: listElo } : b
      )
    );
    const nextQueue = compareQueue.slice(1);
    if (nextQueue.length === 0) {
      setMyList((prev) => {
        const idx = prev.findIndex(b => b._id === candidate._id || b.beer_id === candidate._id);
        if (idx !== -1) {
          const oldElo = prev[idx].elo_score;
          const avgElo = Math.round((oldElo + candidateElo) / 2);
          const updated = [...prev];
          updated[idx] = { ...updated[idx], elo_score: avgElo };
          return updated;
        } else {
          return [...prev, { ...candidate, elo_score: candidateElo }];
        }
      });
      setCandidate(null);
      setComparing(null);
      setCompareQueue([]);
    } else {
      setCompareQueue(nextQueue);
      setComparing(nextQueue[0]);
      setCandidate({ ...candidate, elo_score: candidateElo });
    }
  };

  // Sorted list by elo
  const sortedList = [...myList].sort((a, b) => b.elo_score - a.elo_score);

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <h1 className="text-4xl font-bold text-amber-900 mb-6">Craft Beer Enthusiast</h1>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for beers..."
        />
        <button type="submit" className="bg-amber-700 text-white px-4 py-1 rounded">Search</button>
      </form>
      {results.length === 0 && query && (
        <div className="mb-4">
          <p>No beers found.</p>
          <button className="bg-blue-700 text-white px-4 py-2 rounded mt-2" onClick={() => navigate('/add-beer')}>Add this new beer</button>
        </div>
      )}
      <div className="flex gap-8">
        <div className="w-1/2">
          <h2 className="text-2xl font-semibold mb-2">Search Results</h2>
          <ul>
            {results.map((beer) => (
              <li key={beer._id} className="mb-2 flex justify-between items-center border-b pb-1">
                <span>
                  <span className="font-bold">{beer.name}</span> <span className="text-sm text-gray-600">({beer.type})</span>
                  <br />
                  <span className="text-xs text-gray-500">{beer.brewery}</span>
                </span>
                <button
                  className="ml-2 bg-green-600 text-white px-2 py-1 rounded"
                  onClick={() => handleAdd(beer)}
                  disabled={!!candidate}
                >
                  Add to My List
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/2">
          <div className="flex items-center mb-2">
            <h2 className="text-2xl font-semibold mr-4">My Beer List</h2>
            <select
              className="border rounded px-2 py-1"
              value={selectedListType}
              onChange={e => setSelectedListType(e.target.value)}
            >
              {LIST_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <ol className="list-decimal pl-4">
            {sortedList.map((beer, idx) => (
              <li key={beer._id || beer.beer_id || idx} className="mb-2">
                <span className="font-bold">{beer.name}</span> <span className="text-sm text-gray-600">({beer.type})</span>
                <span className="ml-2 text-xs text-gray-500">Elo: {beer.elo_score}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {/* Pairwise comparison modal */}
      {candidate && comparing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Which beer do you prefer?</h3>
            <div className="flex gap-8">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded text-lg"
                onClick={() => handleCompare('candidate')}
              >
                {candidate.name}
              </button>
              <span className="self-center font-bold text-lg">vs</span>
              <button
                className="bg-amber-700 text-white px-4 py-2 rounded text-lg"
                onClick={() => handleCompare('list')}
              >
                {comparing.name}
              </button>
            </div>
            <p className="mt-4 text-gray-600">({compareQueue.length} left to compare)</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/add-beer" element={<AddBeerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}
