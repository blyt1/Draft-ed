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
        // Get full beer details for each beer in the list - handle both ID formats
        const beerIds = [];
        const stringBeerIds = [];
        for (const beer of list.beers) {
            if (mongodb_1.ObjectId.isValid(beer.beer_id.toString())) {
                beerIds.push(new mongodb_1.ObjectId(beer.beer_id));
            }
            else {
                stringBeerIds.push(beer.beer_id.toString());
            }
        }
        // Query for both ObjectId and string IDs
        const queries = [];
        if (beerIds.length > 0) {
            queries.push({ _id: { $in: beerIds } });
        }
        if (stringBeerIds.length > 0) {
            queries.push({ _id: { $in: stringBeerIds } });
        }
        let fullBeers = [];
        if (queries.length > 0) {
            const beerQuery = queries.length === 1 ? queries[0] : { $or: queries };
            // Add beer type filter if provided
            if (beer_type && typeof beer_type === 'string') {
                fullBeers = await db.collection('beers').find({ ...beerQuery, type: beer_type }).toArray();
            }
            else {
                fullBeers = await db.collection('beers').find(beerQuery).toArray();
            }
        }
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
        // Check if beer exists - handle both ObjectId and string IDs
        let beer;
        if (mongodb_1.ObjectId.isValid(beer_id)) {
            beer = await db.collection('beers').findOne({ _id: new mongodb_1.ObjectId(beer_id) });
        }
        else {
            beer = await db.collection('beers').findOne({ _id: beer_id });
        }
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
        // Check if beer is already in the list - handle both ID formats
        const existingBeer = list.beers.find((b) => {
            const listBeerIdStr = b.beer_id.toString();
            return listBeerIdStr === beer_id || listBeerIdStr === beer._id.toString();
        });
        if (existingBeer) {
            // Re-ranking: average the old and new Elo scores
            const newEloScore = Math.round((existingBeer.elo_score + 1000) / 2);
            await db.collection('beer_lists').updateOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                'beers.beer_id': existingBeer.beer_id
            }, {
                $set: {
                    'beers.$.elo_score': newEloScore,
                    'beers.$.comparisons': 0
                }
            });
            return res.json({ message: 'Beer re-added with averaged Elo score', elo_score: newEloScore });
        }
        else {
            // Add new beer to the list - use the beer's actual ID (string or ObjectId)
            const newUserBeer = {
                beer_id: beer._id,
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
        // Validate IDs - they can be either ObjectId format or simple strings
        if (!beer1_id || !beer2_id || !winner_id) {
            return res.status(400).json({ detail: 'Beer IDs are required' });
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
        // Find both beers in the list - handle both ID formats
        const beer1 = list.beers.find((b) => {
            const beerIdStr = b.beer_id.toString();
            return beerIdStr === beer1_id || beerIdStr === beer1_id.toString();
        });
        const beer2 = list.beers.find((b) => {
            const beerIdStr = b.beer_id.toString();
            return beerIdStr === beer2_id || beerIdStr === beer2_id.toString();
        });
        // If beers aren't in the list, add them from the main database
        if (!beer1 || !beer2) {
            const missingBeers = [];
            // Find missing beers in main collection
            if (!beer1) {
                let foundBeer;
                if (mongodb_1.ObjectId.isValid(beer1_id)) {
                    foundBeer = await db.collection('beers').findOne({ _id: new mongodb_1.ObjectId(beer1_id) });
                }
                else {
                    foundBeer = await db.collection('beers').findOne({ _id: beer1_id });
                }
                if (foundBeer)
                    missingBeers.push(foundBeer);
            }
            if (!beer2) {
                let foundBeer;
                if (mongodb_1.ObjectId.isValid(beer2_id)) {
                    foundBeer = await db.collection('beers').findOne({ _id: new mongodb_1.ObjectId(beer2_id) });
                }
                else {
                    foundBeer = await db.collection('beers').findOne({ _id: beer2_id });
                }
                if (foundBeer)
                    missingBeers.push(foundBeer);
            }
            // Add missing beers to list
            for (const beer of missingBeers) {
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
            const updatedBeer1 = updatedList.beers.find((b) => {
                const beerIdStr = b.beer_id.toString();
                return beerIdStr === beer1_id || beerIdStr === beer1_id.toString();
            }) || { elo_score: 1000, comparisons: 0 };
            const updatedBeer2 = updatedList.beers.find((b) => {
                const beerIdStr = b.beer_id.toString();
                return beerIdStr === beer2_id || beerIdStr === beer2_id.toString();
            }) || { elo_score: 1000, comparisons: 0 };
            // Calculate new Elo ratings
            const beer1Won = winner_id === beer1_id;
            const newBeer1Elo = calculateEloRating(updatedBeer1.elo_score, updatedBeer2.elo_score, beer1Won);
            const newBeer2Elo = calculateEloRating(updatedBeer2.elo_score, updatedBeer1.elo_score, !beer1Won);
            // Update both beers - use their actual beer_id from the list
            await db.collection('beer_lists').updateOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                'beers.beer_id': updatedBeer1.beer_id
            }, {
                $set: {
                    'beers.$.elo_score': newBeer1Elo,
                },
                $inc: { 'beers.$.comparisons': 1 }
            });
            await db.collection('beer_lists').updateOne({
                user_id: new mongodb_1.ObjectId(req.user._id),
                name: list_name,
                'beers.beer_id': updatedBeer2.beer_id
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
        // Update both beers - use their actual beer_id from the list
        await db.collection('beer_lists').updateOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name,
            'beers.beer_id': beer1.beer_id
        }, {
            $set: {
                'beers.$.elo_score': newBeer1Elo,
            },
            $inc: { 'beers.$.comparisons': 1 }
        });
        await db.collection('beer_lists').updateOne({
            user_id: new mongodb_1.ObjectId(req.user._id),
            name: list_name,
            'beers.beer_id': beer2.beer_id
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
