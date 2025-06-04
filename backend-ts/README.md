# Craft Beer Enthusiast API - TypeScript Backend

A TypeScript/Node.js backend for the Craft Beer Enthusiast web application, providing REST API endpoints for user authentication, beer management, and Elo-based ranking system.

## Features

- **User Authentication**: JWT-based registration and login
- **Beer Database**: Search, view, and add craft beers
- **Personalized Lists**: User-specific beer collections
- **Elo Rating System**: Pairwise comparison ranking algorithm
- **Category Filtering**: Filter beers by type (IPA, Stout, etc.)
- **MongoDB Integration**: Native MongoDB driver for data persistence

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **Database**: MongoDB with native driver
- **Authentication**: JWT with bcrypt password hashing
- **CORS**: Enabled for frontend integration

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Beers
- `GET /beers/search` - Search beers (supports query and beer_type filters)
- `GET /beers/:id` - Get beer by ID
- `POST /beers/add` - Add new beer (authenticated)

### User Management
- `GET /user/lists` - Get user's beer lists
- `GET /user/lists/:list_name` - Get specific list with full beer details
- `POST /user/lists/:list_name/beers/:beer_id` - Add beer to list
- `POST /user/compare` - Record pairwise comparison with Elo updates

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```
   PORT=8000
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=craftbeer
   SECRET_KEY=your-secret-key-here
   ```

3. **Start MongoDB**:
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas connection string in MONGO_URL
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

The server will start on `http://localhost:8000` and automatically seed the database with sample beers on first run.

### Build for Production

```bash
npm run build
npm start
```

## Data Models

### User
```typescript
{
  _id: ObjectId,
  username: string,
  email: string,
  hashed_password: string,
  created_at: Date
}
```

### Beer
```typescript
{
  _id: ObjectId,
  name: string,
  brewery: string,
  type: string,
  abv?: number,
  ibu?: number,
  description?: string,
  image_url?: string,
  created_at: Date
}
```

### Beer List
```typescript
{
  _id: ObjectId,
  user_id: ObjectId,
  name: string,
  beers: [
    {
      beer_id: ObjectId,
      elo_score: number,
      comparisons: number,
      created_at: Date
    }
  ],
  created_at: Date
}
```

## Elo Rating System

The application uses a standard Elo rating algorithm for ranking beers:
- Initial rating: 1000
- K-factor: 32
- Ratings update after each pairwise comparison
- Separate rankings per user and per category

## Sample Data

The database seeds with 5 craft beers:
- Pliny the Elder (Double IPA)
- Guinness Draught (Stout)
- Sierra Nevada Pale Ale (Pale Ale)
- Allagash White (Witbier)
- Heady Topper (Double IPA)

## Development

```bash
# Development with auto-reload
npm run dev

# Run linter
npm run lint

# Run tests
npm test

# Manual database seeding
npm run seed
```

## Deployment

The backend is designed to be deployed on platforms like:
- **Render** (recommended)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**

Update CORS settings in production and use MongoDB Atlas for the database.

## Frontend Integration

This backend is designed to work with the React/TypeScript frontend. Ensure:
1. CORS is properly configured for your frontend domain
2. JWT tokens are included in Authorization headers as `Bearer <token>`
3. All endpoints return consistent JSON error responses with `detail` field 