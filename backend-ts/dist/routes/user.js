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
// Elo rating calculation function
const calculateEloRating = (currentRating, opponentRating, won, kFactor = 32) => {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const actualScore = won ? 1 : 0;
    return Math.round(currentRating + kFactor * (actualScore - expectedScore));
};
// Get user's beer lists
router.get('/lists', auth_1.authenticate, async (req, res) => {
    try {
        const db = (0, database_1.getDatabase)();
        const lists = await db.collection('beer_lists').find({ user_id: new mongodb_1.ObjectId(req.user._id) }).toArray();
        const listResponses = lists.map(list => ({
            _id: list._id.toString(),
            user_id: list.user_id.toString(),
            name: list.name,
            beers: list.beers.map((beer) => ({
                beer_id: beer.beer_id.toString(),
                elo_score: beer.elo_score,
                comparisons: beer.comparisons,
                created_at: beer.created_at
            })),
            created_at: list.created_at
        }));
        res.json(listResponses);
    }
    catch (error) {
        console.error('Get lists error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
// Get specific beer list with full beer details
router.get('/lists/:list_name', auth_1.authenticate, async (req, res) => {
    try {
        const { list_name } = req.params;
        const { beer_type } = req.query;
        const db = (0, database_1.getDatabase)();
        const list = await db.collection('beer_lists').findOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name
        });
        if (!list) {
            return res.status(404).json({ detail: 'List not found' });
        }
        // Get full beer details for each beer in the list
        const beerIds = list.beers.map((beer) => new mongodb_1.ObjectId(beer.beer_id));
        let beerQuery = { _id: { $in: beerIds } };
        // Add beer type filter if provided
        if (beer_type && typeof beer_type === 'string') {
            beerQuery.type = beer_type;
        }
        const fullBeers = await db.collection('beers').find(beerQuery).toArray();
        // Combine beer details with user-specific data
        const beersWithDetails = list.beers
            .filter((userBeer) => {
            const fullBeer = fullBeers.find(b => b._id.toString() === userBeer.beer_id.toString());
            return beer_type ? (fullBeer === null || fullBeer === void 0 ? void 0 : fullBeer.type) === beer_type : true;
        })
            .map((userBeer) => {
            const fullBeer = fullBeers.find(b => b._id.toString() === userBeer.beer_id.toString());
            return {
                ...fullBeer,
                _id: fullBeer === null || fullBeer === void 0 ? void 0 : fullBeer._id.toString(),
                elo_score: userBeer.elo_score,
                comparisons: userBeer.comparisons,
                user_created_at: userBeer.created_at
            };
        })
            .sort((a, b) => b.elo_score - a.elo_score);
        res.json({
            _id: list._id.toString(),
            user_id: list.user_id.toString(),
            name: list.name,
            beers: beersWithDetails,
            created_at: list.created_at
        });
    }
    catch (error) {
        console.error('Get list error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
// Add beer to user's list
router.post('/lists/:list_name/beers/:beer_id', auth_1.authenticate, async (req, res) => {
    try {
        const { list_name, beer_id } = req.params;
        const db = (0, database_1.getDatabase)();
        if (!mongodb_1.ObjectId.isValid(beer_id)) {
            return res.status(400).json({ detail: 'Invalid beer ID' });
        }
        // Check if beer exists
        const beer = await db.collection('beers').findOne({ _id: new mongodb_1.ObjectId(beer_id) });
        if (!beer) {
            return res.status(404).json({ detail: 'Beer not found' });
        }
        // Find or create the list
        let list = await db.collection('beer_lists').findOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name
        });
        if (!list) {
            // Create new list
            const newList = {
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                beers: [],
                created_at: new Date()
            };
            const result = await db.collection('beer_lists').insertOne(newList);
            list = { ...newList, _id: result.insertedId };
        }
        // Check if beer is already in the list
        const existingBeer = list.beers.find((b) => b.beer_id.toString() === beer_id);
        if (existingBeer) {
            // Re-ranking: average the old and new Elo scores
            const newEloScore = Math.round((existingBeer.elo_score + 1000) / 2);
            await db.collection('beer_lists').updateOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                'beers.beer_id': new mongodb_1.ObjectId(beer_id)
            }, {
                $set: {
                    'beers.$.elo_score': newEloScore,
                    'beers.$.comparisons': 0
                }
            });
            return res.json({ message: 'Beer re-added with averaged Elo score', elo_score: newEloScore });
        }
        else {
            // Add new beer to the list
            const newUserBeer = {
                beer_id: new mongodb_1.ObjectId(beer_id),
                elo_score: 1000,
                comparisons: 0,
                created_at: new Date()
            };
            await db.collection('beer_lists').updateOne({ user_id: new mongodb_1.ObjectId(req.user._id), name: list_name }, { $push: { beers: newUserBeer } });
            return res.json({ message: 'Beer added to list' });
        }
    }
    catch (error) {
        console.error('Add beer to list error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
// Compare two beers (Elo rating update)
router.post('/compare', auth_1.authenticate, async (req, res) => {
    try {
        const { beer1_id, beer2_id, winner_id, list_name } = req.body;
        const db = (0, database_1.getDatabase)();
        if (!mongodb_1.ObjectId.isValid(beer1_id) || !mongodb_1.ObjectId.isValid(beer2_id) || !mongodb_1.ObjectId.isValid(winner_id)) {
            return res.status(400).json({ detail: 'Invalid beer IDs' });
        }
        if (winner_id !== beer1_id && winner_id !== beer2_id) {
            return res.status(400).json({ detail: 'Winner must be one of the compared beers' });
        }
        // Get the user's list
        const list = await db.collection('beer_lists').findOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name
        });
        if (!list) {
            return res.status(404).json({ detail: 'List not found' });
        }
        // Find both beers in the list
        const beer1 = list.beers.find((b) => b.beer_id.toString() === beer1_id);
        const beer2 = list.beers.find((b) => b.beer_id.toString() === beer2_id);
        // If beers aren't in the list, add them from the main database
        if (!beer1 || !beer2) {
            const missingBeerIds = [];
            if (!beer1)
                missingBeerIds.push(new mongodb_1.ObjectId(beer1_id));
            if (!beer2)
                missingBeerIds.push(new mongodb_1.ObjectId(beer2_id));
            const beersToAdd = await db.collection('beers').find({ _id: { $in: missingBeerIds } }).toArray();
            for (const beer of beersToAdd) {
                const newUserBeer = {
                    beer_id: beer._id,
                    elo_score: 1000,
                    comparisons: 0,
                    created_at: new Date()
                };
                await db.collection('beer_lists').updateOne({ user_id: new mongodb_1.ObjectId(req.user._id), name: list_name }, { $push: { beers: newUserBeer } });
            }
            // Refetch the list
            const updatedList = await db.collection('beer_lists').findOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name
            });
            if (!updatedList) {
                return res.status(500).json({ detail: 'Failed to update list' });
            }
            // Update references
            const updatedBeer1 = updatedList.beers.find((b) => b.beer_id.toString() === beer1_id) || { elo_score: 1000, comparisons: 0 };
            const updatedBeer2 = updatedList.beers.find((b) => b.beer_id.toString() === beer2_id) || { elo_score: 1000, comparisons: 0 };
            // Calculate new Elo ratings
            const beer1Won = winner_id === beer1_id;
            const newBeer1Elo = calculateEloRating(updatedBeer1.elo_score, updatedBeer2.elo_score, beer1Won);
            const newBeer2Elo = calculateEloRating(updatedBeer2.elo_score, updatedBeer1.elo_score, !beer1Won);
            // Update both beers
            await db.collection('beer_lists').updateOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                'beers.beer_id': new mongodb_1.ObjectId(beer1_id)
            }, {
                $set: {
                    'beers.$.elo_score': newBeer1Elo,
                },
                $inc: { 'beers.$.comparisons': 1 }
            });
            await db.collection('beer_lists').updateOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                'beers.beer_id': new mongodb_1.ObjectId(beer2_id)
            }, {
                $set: {
                    'beers.$.elo_score': newBeer2Elo,
                },
                $inc: { 'beers.$.comparisons': 1 }
            });
            return res.json({
                message: 'Comparison recorded',
                beer1_new_elo: newBeer1Elo,
                beer2_new_elo: newBeer2Elo
            });
        }
        // Calculate new Elo ratings
        const beer1Won = winner_id === beer1_id;
        const newBeer1Elo = calculateEloRating(beer1.elo_score, beer2.elo_score, beer1Won);
        const newBeer2Elo = calculateEloRating(beer2.elo_score, beer1.elo_score, !beer1Won);
        // Update both beers
        await db.collection('beer_lists').updateOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name,
            'beers.beer_id': new mongodb_1.ObjectId(beer1_id)
        }, {
            $set: {
                'beers.$.elo_score': newBeer1Elo,
            },
            $inc: { 'beers.$.comparisons': 1 }
        });
        await db.collection('beer_lists').updateOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name,
            'beers.beer_id': new mongodb_1.ObjectId(beer2_id)
        }, {
            $set: {
                'beers.$.elo_score': newBeer2Elo,
            },
            $inc: { 'beers.$.comparisons': 1 }
        });
        res.json({
            message: 'Comparison recorded',
            beer1_new_elo: newBeer1Elo,
            beer2_new_elo: newBeer2Elo
        });
    }
    catch (error) {
        console.error('Compare beers error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
exports.default = router;
