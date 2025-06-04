import { useState, useEffect } from 'react'
import './App.css'
import { searchBeers, getList, addBeerToList, updateElo, login, register, getBeerById, addBeer } from './api'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'

interface Beer {
  _id: string;
  name: string;
  brewery?: string;
  type?: string;
  abv?: number;
  ibu?: number;
  description?: string;
  image_url?: string;
  created_at?: string;
}

interface BeerInList extends Beer {
  beer_id?: string; // for backend compatibility
  elo_score: number;
  comparisons?: number;
  user_created_at?: string;
}

const DEFAULT_LIST_TYPE = 'All Beers';
const LIST_TYPES = [
  'All Beers',
  'Double IPA',
  'Stout',
  'Pale Ale',
  'Witbier',
  'IPA',
  'Sour',
  'Lager',
  'Ale',
  // Add more as needed
];

async function fetchBeerDetails(beerInList: any): Promise<BeerInList> {
  const id = beerInList.beer_id || beerInList._id;
  try {
    const beer = await getBeerById(id);
    return { 
      ...beer, 
      elo_score: beerInList.elo_score || 1000,
      comparisons: beerInList.comparisons || 0,
      user_created_at: beerInList.user_created_at
    };
  } catch {
    return { 
      ...beerInList, 
      _id: id,
      name: beerInList.name || 'Unknown Beer',
      brewery: beerInList.brewery || 'Unknown Brewery',
      type: beerInList.type || 'Unknown Type',
      elo_score: beerInList.elo_score || 1000,
      comparisons: beerInList.comparisons || 0
    };
  }
}

// Header Component
function Header({ isLoggedIn, onLogout }: { isLoggedIn: boolean; onLogout: () => void }) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">Draft Beers</h1>
        <div className="auth-buttons">
          {isLoggedIn ? (
            <button onClick={onLogout} className="btn btn-danger">
              Logout
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn btn-secondary">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn btn-primary">
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Beer Card Component for Search Results
function BeerCard({ beer, onAdd, isLoggedIn, disabled }: { 
  beer: Beer; 
  onAdd: (beer: Beer) => void; 
  isLoggedIn: boolean; 
  disabled: boolean; 
}) {
  return (
    <div className="beer-card">
      <div className="beer-name">{beer.name}</div>
      <div className="beer-brewery">{beer.brewery}</div>
      <div className="beer-type">{beer.type}</div>
      
      <div className="beer-stats">
        {beer.abv && <span className="beer-stat">ABV: {beer.abv}%</span>}
        {beer.ibu && <span className="beer-stat">IBU: {beer.ibu}</span>}
      </div>
      
      {beer.description && (
        <div className="beer-description">{beer.description}</div>
      )}
      
      <div className="beer-actions">
        <button
          className="btn-add"
          onClick={() => onAdd(beer)}
          disabled={disabled || !isLoggedIn}
        >
          {!isLoggedIn ? 'Login to Add' : 'Add to My List'}
        </button>
      </div>
    </div>
  );
}

// Beer List Item Component
function BeerListItem({ beer, index }: { beer: BeerInList; index: number }) {
  return (
    <div className="beer-list-item">
      <div className="beer-ranking">{index + 1}</div>
      <div className="beer-name">{beer.name}</div>
      <div className="beer-brewery">{beer.brewery}</div>
      <div className="beer-type">{beer.type}</div>
      
      <div className="beer-stats">
        {beer.abv && <span className="beer-stat">ABV: {beer.abv}%</span>}
        {beer.ibu && <span className="beer-stat">IBU: {beer.ibu}</span>}
        {beer.comparisons && <span className="beer-stat">{beer.comparisons} comparisons</span>}
      </div>
      
      {beer.description && (
        <div className="beer-description">{beer.description}</div>
      )}
      
      <div className="beer-elo">Elo: {beer.elo_score}</div>
    </div>
  );
}

// Inline Add Beer Form Component
function InlineAddBeerForm({ searchQuery, onBeerAdded, onCancel }: {
  searchQuery: string;
  onBeerAdded: (beer: Beer) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: searchQuery,
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
      const newBeer = await addBeer(form);
      onBeerAdded(newBeer);
      onCancel(); // Close the form
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="beer-card add-beer-card">
      <h3 className="beer-name">Add New Beer</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="Beer Name" 
            required 
            className="form-input" 
          />
        </div>
        <div className="form-group">
          <input 
            name="brewery" 
            value={form.brewery} 
            onChange={handleChange} 
            placeholder="Brewery" 
            required 
            className="form-input" 
          />
        </div>
        <div className="form-group">
          <input 
            name="type" 
            value={form.type} 
            onChange={handleChange} 
            placeholder="Beer Type (e.g. IPA)" 
            required 
            className="form-input" 
          />
        </div>
        <div className="beer-stats">
          <input 
            name="abv" 
            value={form.abv} 
            onChange={handleChange} 
            placeholder="ABV %" 
            className="form-input-small" 
          />
          <input 
            name="ibu" 
            value={form.ibu} 
            onChange={handleChange} 
            placeholder="IBU" 
            className="form-input-small" 
          />
        </div>
        <div className="form-group">
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            placeholder="Description (optional)" 
            className="form-input" 
            rows={2}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="beer-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Beer'}
          </button>
        </div>
      </form>
    </div>
  );
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
      await addBeer(form);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoggedIn = !!localStorage.getItem('token');
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="main-content">
        <div className="auth-container" style={{ margin: '2rem auto', maxWidth: '500px' }}>
          <h1 className="auth-title">Add a New Beer</h1>
          <form onSubmit={handleSubmit} className="form-group">
            <div className="form-group">
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Beer Name" 
                required 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <input 
                name="brewery" 
                value={form.brewery} 
                onChange={handleChange} 
                placeholder="Brewery" 
                required 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <input 
                name="type" 
                value={form.type} 
                onChange={handleChange} 
                placeholder="Beer Type (e.g. IPA)" 
                required 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <input 
                name="abv" 
                value={form.abv} 
                onChange={handleChange} 
                placeholder="ABV %" 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <input 
                name="ibu" 
                value={form.ibu} 
                onChange={handleChange} 
                placeholder="IBU" 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Description" 
                className="form-input" 
                rows={3}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Adding Beer...' : 'Add Beer'}
            </button>
            <button 
              type="button" 
              className="auth-link" 
              onClick={() => navigate('/app')}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      localStorage.setItem('token', res.access_token);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Welcome to Draft Beers</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Username or Email" 
              required 
              className="form-input" 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Password" 
              required 
              className="form-input" 
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button 
            type="button" 
            className="auth-link" 
            onClick={() => navigate('/register')}
          >
            Don't have an account? Register here
          </button>
        </form>
      </div>
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
      await register(username, email, password);
      // After registration, login automatically
      const loginRes = await login(username, password);
      localStorage.setItem('token', loginRes.access_token);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Join Draft Beers</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Username" 
              required 
              className="form-input" 
            />
          </div>
          <div className="form-group">
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Email" 
              required 
              className="form-input" 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Password" 
              required 
              className="form-input" 
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
          <button 
            type="button" 
            className="auth-link" 
            onClick={() => navigate('/login')}
          >
            Already have an account? Login here
          </button>
        </form>
      </div>
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
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load list from backend on mount
  useEffect(() => {
    const loadList = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const listData = await getList(token, selectedListType === DEFAULT_LIST_TYPE ? undefined : selectedListType);
        
        if (listData && listData.beers) {
          const beersWithDetails = await Promise.all(
            listData.beers.map(fetchBeerDetails)
          );
          setMyList(beersWithDetails);
        } else {
          setMyList([]);
        }
      } catch (error) {
        console.error('Failed to load list:', error);
        setMyList([]);
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [selectedListType]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    try {
      const searchResults = await searchBeers(query, selectedListType === DEFAULT_LIST_TYPE ? undefined : selectedListType);
      setResults(searchResults);
      setShowAddForm(false); // Hide add form when showing search results
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    }
  };

  const handleAdd = async (beer: Beer) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Add beer to backend
      await addBeerToList(beer._id, selectedListType, token);

      // Convert to BeerInList format
      const newBeer: BeerInList = { ...beer, elo_score: 1000, comparisons: 0 };

      // Determine beers to compare against (EXCLUDE the same beer to prevent self-comparison)
      const beersToCompare = myList.filter(b => {
        const sameType = selectedListType === DEFAULT_LIST_TYPE || b.type === selectedListType;
        const notSameBeer = b._id !== beer._id && b.beer_id !== beer._id; // Prevent self-comparison
        return sameType && notSameBeer;
      });

      if (beersToCompare.length > 0) {
        setCandidate(newBeer);
        setCompareQueue([...beersToCompare]);
        setComparing(beersToCompare[0]);
      } else {
        // No beers to compare, just add to list
        setMyList(prev => [...prev, newBeer]);
      }
    } catch (error) {
      console.error('Failed to add beer:', error);
      alert('Failed to add beer to your list');
    }
  };

  const handleNewBeerAdded = async (newBeer: Beer) => {
    // After creating a new beer, add it to the search results and user's list
    setResults([newBeer]);
    await handleAdd(newBeer);
  };

  const handleCompare = async (winner: 'candidate' | 'list') => {
    if (!candidate || !comparing) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const winnerId = winner === 'candidate' ? candidate._id : comparing._id;
      
      await updateElo(
        selectedListType,
        candidate._id,
        comparing._id,
        winnerId,
        token
      );

      // Calculate new Elo ratings locally for immediate UI update
      const K = 32;
      const candidateRating = candidate.elo_score;
      const comparingRating = comparing.elo_score;
      
      const expectedCandidate = 1 / (1 + Math.pow(10, (comparingRating - candidateRating) / 400));
      const actualCandidate = winner === 'candidate' ? 1 : 0;
      
      const newCandidateElo = Math.round(candidateRating + K * (actualCandidate - expectedCandidate));
      const newComparingElo = Math.round(comparingRating + K * ((1 - actualCandidate) - (1 - expectedCandidate)));

      // Update the comparing beer in myList
      setMyList(prev =>
        prev.map((b) =>
          b._id === comparing._id || b.beer_id === comparing._id 
            ? { ...b, elo_score: newComparingElo, comparisons: (b.comparisons || 0) + 1 } 
            : b
        )
      );

      const nextQueue = compareQueue.slice(1);
      if (nextQueue.length === 0) {
        // Comparison complete - add/update candidate in list
        setMyList((prev) => {
          const idx = prev.findIndex(b => b._id === candidate._id || b.beer_id === candidate._id);
          if (idx !== -1) {
            // Update existing beer
            const updated = [...prev];
            updated[idx] = { 
              ...updated[idx], 
              elo_score: newCandidateElo,
              comparisons: (updated[idx].comparisons || 0) + 1
            };
            return updated;
          } else {
            // Add new beer
            return [...prev, { 
              ...candidate, 
              elo_score: newCandidateElo,
              comparisons: 1
            }];
          }
        });
        
        setCandidate(null);
        setComparing(null);
        setCompareQueue([]);
      } else {
        setCompareQueue(nextQueue);
        setComparing(nextQueue[0]);
        setCandidate({ ...candidate, elo_score: newCandidateElo });
      }
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Failed to record comparison');
    }
  };

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setMyList([]);
    navigate('/');
  };

  // Sorted list by elo
  const sortedList = [...myList].sort((a, b) => b.elo_score - a.elo_score);

  return (
    <div>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for beers..."
            />
            <button type="submit" className="btn-search">Search</button>
          </form>
          
          {results.length === 0 && query && !showAddForm && (
            <div className="text-center">
              <p>No beers found matching your search.</p>
              <button 
                className="btn btn-primary mt-2" 
                onClick={() => setShowAddForm(true)}
              >
                Add "{query}" to database
              </button>
            </div>
          )}
        </div>
        
        <div className="content-grid">
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Search Results</h2>
            </div>
            <div className="section-content">
              {showAddForm ? (
                <InlineAddBeerForm 
                  searchQuery={query}
                  onBeerAdded={handleNewBeerAdded}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : results.length === 0 ? (
                <div className="empty-state">
                  <h3>No search results</h3>
                  <p>Enter a beer name above to search our database</p>
                </div>
              ) : (
                results.map((beer) => (
                  <BeerCard
                    key={beer._id}
                    beer={beer}
                    onAdd={handleAdd}
                    isLoggedIn={isLoggedIn}
                    disabled={!!candidate}
                  />
                ))
              )}
            </div>
          </div>
          
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">My Beer Rankings</h2>
              <select
                className="list-selector"
                value={selectedListType}
                onChange={e => setSelectedListType(e.target.value)}
              >
                {LIST_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="section-content">
              {loading ? (
                <div className="loading">Loading your beer list...</div>
              ) : !isLoggedIn ? (
                <div className="empty-state">
                  <h3>Please login</h3>
                  <p>Login to see your personalized beer rankings</p>
                </div>
              ) : sortedList.length === 0 ? (
                <div className="empty-state">
                  <h3>No beers ranked yet</h3>
                  <p>Search and add beers to start building your rankings!</p>
                </div>
              ) : (
                sortedList.map((beer, index) => (
                  <BeerListItem 
                    key={beer._id || beer.beer_id || index} 
                    beer={beer} 
                    index={index} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Pairwise comparison modal */}
      {candidate && comparing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Which beer do you prefer?</h3>
            <div className="comparison-options">
              <button
                className="comparison-btn"
                onClick={() => handleCompare('candidate')}
              >
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{candidate.name}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  {candidate.brewery} • {candidate.type}
                </div>
              </button>
              <div className="comparison-vs">VS</div>
              <button
                className="comparison-btn"
                onClick={() => handleCompare('list')}
              >
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{comparing.name}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  {comparing.brewery} • {comparing.type}
                </div>
              </button>
            </div>
            <p className="comparison-remaining">
              {compareQueue.length} comparison{compareQueue.length !== 1 ? 's' : ''} remaining
            </p>
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
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/add-beer" element={<AddBeerPage />} />
      </Routes>
    </Router>
  );
}
