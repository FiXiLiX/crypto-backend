const router = require('express').Router();
const errorHandler = require('../helpers/error-handler');
const { query, validationResult } = require('express-validator');
const passport = require('passport');
const redis = require('../redis');

const Transaction = require('../models/Transaction');

router.get('/', passport.authenticate('jwt', {session: false}), [
    query('start').isNumeric().withMessage('Start must be a number'),
    query('limit').isNumeric().withMessage('Limit must be a number'),
],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try{
        const transactions = await Transaction.find({
            user_id: req.user._id,
        })
        .skip(Number(req.query.start)-1)
        .limit(Number(req.query.limit))
        .sort({created_at: -1});

        let numberOfTransactions = await redis.get(req.user.emial + 'numberOfTransactions');
        if(numberOfTransactions===null){
            numberOfTransactions = await Transaction.countDocuments({user_id: req.user._id});
            redis.set(req.user.emial + 'numberOfTransactions', numberOfTransactions, 'EX', 10 * 60);
        }

        return res.status(200).json({ transactions, 
        metadata: { 
            numberOfTransactions,
            pages: Math.ceil(Number(numberOfTransactions)/Number(req.query.limit)),
            start: Number(req.query.start),
            limit: Number(req.query.limit)
        } });
    }
    catch(error) {return res.status(400).json(errorHandler(error));}
    
})

module.exports = router;