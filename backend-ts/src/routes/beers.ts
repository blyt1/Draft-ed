import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { authenticate, AuthenticatedRequest } from '../utils/auth';
import { BeerCreate, BeerResponse } from '../models/types';

const router = express.Router();

// Search beers
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q = '', beer_type } = req.query;
    const db = getDatabase();
    
    let query: any = {};
    
    // Add text search if query provided
    if (q && typeof q === 'string' && q.trim()) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brewery: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Add beer type filter if provided
    if (beer_type && typeof beer_type === 'string') {
      query.type = beer_type;
    }
    
    const beers = await db.collection('beers')
      .find(query)
      .limit(50)
      .toArray();
    
    const beerResponses: BeerResponse[] = beers.map(beer => ({
      _id: beer._id.toString(),
      name: beer.name,
      brewery: beer.brewery,
      type: beer.type,
      abv: beer.abv,
      ibu: beer.ibu,
      description: beer.description,
      image_url: beer.image_url,
      created_at: beer.created_at
    }));
    
    res.json(beerResponses);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get beer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    let beer;
    
    // Try to find beer by ObjectId first (for new beers)
    if (ObjectId.isValid(id)) {
      beer = await db.collection('beers').findOne({ _id: new ObjectId(id) });
    }
    
    // If not found and ID is not ObjectId, try finding by string ID (for legacy beers)
    if (!beer) {
      beer = await db.collection('beers').findOne({ _id: id });
    }
    
    if (!beer) {
      return res.status(404).json({ detail: 'Beer not found' });
    }

    const beerResponse: BeerResponse = {
      _id: beer._id.toString(),
      name: beer.name,
      brewery: beer.brewery,
      type: beer.type,
      abv: beer.abv,
      ibu: beer.ibu,
      description: beer.description,
      image_url: beer.image_url,
      created_at: beer.created_at
    };

    res.json(beerResponse);
  } catch (error) {
    console.error('Get beer error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Add new beer (authenticated)
router.post('/add', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const beerData: BeerCreate = req.body;
    
    if (!beerData.name || !beerData.brewery || !beerData.type) {
      return res.status(400).json({ detail: 'Name, brewery, and type are required' });
    }
    
    const db = getDatabase();
    
    // Check if beer already exists
    const existingBeer = await db.collection('beers').findOne({
      name: beerData.name,
      brewery: beerData.brewery
    });
    
    if (existingBeer) {
      return res.status(400).json({ detail: 'Beer already exists' });
    }
    
    const newBeer = {
      ...beerData,
      created_at: new Date()
    };
    
    const result = await db.collection('beers').insertOne(newBeer);
    
    const beerResponse: BeerResponse = {
      _id: result.insertedId.toString(),
      name: newBeer.name,
      brewery: newBeer.brewery,
      type: newBeer.type,
      abv: newBeer.abv,
      ibu: newBeer.ibu,
      description: newBeer.description,
      image_url: newBeer.image_url,
      created_at: newBeer.created_at
    };
    
    res.status(201).json(beerResponse);
  } catch (error) {
    console.error('Add beer error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
