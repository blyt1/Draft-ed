"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const router = express_1.default.Router();
// Search beers
router.get('/search', async (req, res) => {
    try {
        const { q = '', beer_type } = req.query;
        const db = (0, database_1.getDatabase)();
        let query = {};
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
        const beerResponses = beers.map(beer => ({
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
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
// Get beer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(400).json({ detail: 'Invalid beer ID' });
        }
        const db = (0, database_1.getDatabase)();
        const beer = await db.collection('beers').findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!beer) {
            return res.status(404).json({ detail: 'Beer not found' });
        }
        const beerResponse = {
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
    }
    catch (error) {
        console.error('Get beer error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
// Add new beer (authenticated)
router.post('/add', auth_1.authenticate, async (req, res) => {
    try {
        const beerData = req.body;
        if (!beerData.name || !beerData.brewery || !beerData.type) {
            return res.status(400).json({ detail: 'Name, brewery, and type are required' });
        }
        const db = (0, database_1.getDatabase)();
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
        const beerResponse = {
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
    }
    catch (error) {
        console.error('Add beer error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
exports.default = router;
