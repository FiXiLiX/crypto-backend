require('dotenv').config()
const router = require('express').Router();
const passport = require('passport');
const errorHandler = require('../helpers/error-handler');
const { body, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const checkForData = require('../helpers/check-for-data');

const User = require('../models/User');
const Coin = require('../models/Coin');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');

router.get('/', passport.authenticate('jwt', {session: false}), [
    query('start').isNumeric().withMessage('Start must be a number'),
    query('limit').isNumeric().withMessage('Limit must be a number'),
    query('search').isString().withMessage('Search must be a string')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    await checkForData();
    const {start, limit, search} = req.query;
    try{
        const coins = await Coin.getAll(start, limit, search);
        return res.status(200).json({coins});
    }catch(error){return res.status(400).json(errorHandler(error))}
})

router.get('/my', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    await checkForData();
    try {
        const coins = await Coin.getMyCoins(req.user._id)
        return res.status(200).json({coins})
    } catch (error) {
        return res.status(400).json(errorHandler(error));
    }
})

router.get('/my/single', passport.authenticate('jwt', {session: false}), [
    query('coin_id').isNumeric().withMessage('Coin ID must be a number'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    await checkForData();
    try {
        const coin = await Coin.getMyCoin(req.user._id, req.query.coin_id)
        return res.status(200).json({coin})
    } catch (error) {
        return res.status(400).json(errorHandler(error));
    }
})

router.post('/buy', passport.authenticate('jwt', {session: false}), [
    body('coin_id').isNumeric().withMessage('Coin must be an number'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        await checkForData();
        const {coin_id, amount} = req.body;
        //Try to find coin
        const coin = await Coin.findOne({cmc_id: coin_id});
        if(!coin) throw {
            type: 'custom',
            param: 'global', 
            message: 'Token does not exist',
        };
        // Check does user have enough money to spend
        const price = coin.price * Number(amount)
        if(price > Number(req.user.dolars))throw {
            type: 'custom',
            param: 'amount',
            message: 'You does not have enough money'
        };
        // Find holding if exists
        let holding = await Holding.findOne({user_id: req.user._id, coin_id: coin.cmc_id});
        if(holding)await holding.changeAmount(amount);
        else holding = await Holding.create({
            user_id: req.user._id,
            coin_id: coin.cmc_id,
            value: amount,
        });
        // Find user to edit dolars amount
        const user = await User.findById(req.user._id);
        user.dolars -= price;
        await user.save()

        //Make new transaction
        await Transaction.create({
            type: 'buy',
            user_id: req.user._id,
            coin_id: coin.cmc_id,
            coin_symbol: coin.symbol,
            amount,
            price: coin.price
        });

        return res.status(200).json({holding, dolars: user.dolars})
    } catch (error) {
        console.log(error);
        return res.status(400).json(errorHandler(error))
    }
})

router.post('/sell', passport.authenticate('jwt', {session: false}), [
    body('coin_id').isNumeric().withMessage('Coin must be a number'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    await checkForData();
    try {
        const {coin_id, amount} = req.body;
        //Try to find coin
        const coin = await Coin.findOne({cmc_id: coin_id});
        if(!coin) throw {
            type: 'custom',
            param: 'global', 
            message: 'Token does not exist',
        };
        const price = coin.price * Number(amount)
        // Find holding if exists
        let holding = await Holding.findOne({user_id: req.user._id, coin_id});
        if(holding)await holding.changeAmount(-amount);
        else holding = await Holding.create({
            user_id: req.user._id,
            coin_id: coin_id,
            value: amount,
        });
        // Find user to edit dolars amount
        const user = await User.findById(req.user._id);
        user.dolars += price;
        await user.save()

        await Transaction.create({
            type: 'sell',
            user_id: req.user._id,
            coin_id: coin.cmc_id,
            coin_symbol: coin.symbol,
            amount,
            price: coin.price
        });

        return res.status(200).json({holding, dolars: user.dolars})
    } catch (error) {
        console.log(error);
        return res.status(400).json(errorHandler(error))
    }
})

module.exports = router;