# Draft Beers - Craft Beer Ranking Application

A modern web application for ranking and comparing craft beers using an intelligent Elo rating system. Built with React (TypeScript) frontend and Node.js/Express (TypeScript) backend with MongoDB.

![Draft Beers Application](https://via.placeholder.com/800x400?text=Draft+Beers+Application)

## Features

- 🍺 **Beer Database**: Search and add craft beers with detailed information
- 📊 **Elo Rating System**: Intelligent pairwise comparison ranking
- 🎨 **Modern UI**: Dark theme with brand color accents
- 🔐 **User Authentication**: Secure JWT-based login/registration
- 📱 **Responsive Design**: Works on desktop and mobile
- 🏷️ **Category Filtering**: Filter beers by type (IPA, Stout, etc.)
- ⚡ **Real-time Updates**: Instant UI updates with backend sync
- 🎯 **Inline Beer Creation**: Add new beers directly from search results

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Custom CSS** with CSS variables (dark theme)
- **Responsive Design** with mobile-first approach

### Backend
- **Node.js** with **Express 4.18**
- **TypeScript** for type safety
- **MongoDB** with native driver
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - See installation instructions below
- **Git** - [Download](https://git-scm.com/)

## MongoDB Setup

### Option 1: Local MongoDB Installation

#### On macOS (using Homebrew):
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# MongoDB will be available at: mongodb://localhost:27017
```

#### On Ubuntu/Debian:
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list and install
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# MongoDB will be available at: mongodb://localhost:27017
```

#### On Windows:
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Choose "Complete" installation
4. Install MongoDB as a Service
5. MongoDB will be available at: `mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud - Recommended for production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Create a free account
3. Create a new cluster (free tier available)
4. Create a database user with read/write permissions
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Option 3: Docker (Alternative)
```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connection string: mongodb://admin:password@localhost:27017
```

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd Drafted2
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend-ts

# Install dependencies
npm install

# Create environment file
touch .env
```

Edit the `.env` file with your configuration:
```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=craftbeer

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=8000
NODE_ENV=development
```

**Important**: Replace `your-super-secret-jwt-key-change-this-in-production` with a strong, random secret key.

```bash
# Build the TypeScript code
npm run build

# Start the development server
npm run dev

# The backend will be running at http://localhost:8000
```

### 3. Frontend Setup

Open a new terminal window/tab:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# The frontend will be running at http://localhost:5173
```

### 4. Verify Setup

1. **Backend**: Visit http://localhost:8000 - you should see: `{"message": "Craft Beer Enthusiast API is running."}`
2. **Frontend**: Visit http://localhost:5173 - you should see the Draft Beers login page
3. **Database**: The application will automatically seed sample beers on first run

## Database Seeding

The application includes sample data that gets automatically seeded when you first start the backend. This includes:

- 5 sample craft beers (Pliny the Elder, Guinness, etc.)
- Default beer categories

To manually seed the database:
```bash
cd backend-ts
npm run seed
```

## Available Scripts

### Backend (`backend-ts/`)
```bash
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript to JavaScript
npm start          # Start production server (requires build first)
npm run seed       # Seed database with sample data
npm run lint       # Run ESLint
npm test           # Run tests
```

### Frontend (`frontend/`)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```
