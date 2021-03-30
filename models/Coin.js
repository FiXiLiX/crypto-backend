const mongoose = require('mongoose');
const moment = require('moment')
const Schema = mongoose.Schema;

const Holding = require('./Holding')

const coinSchema = new Schema({
    cmc_id: {type: String, required: true},
    name: {type: String, required: true},
    symbol: {type: String, required: true},
    slug: {type: String, required: true},
    price: {type: Number, required: true},
    created_at: {type: Date, default: moment(), required: true},
    updated_at: {type: Date, default: moment(), required: true},
    percent_change_1h: {type: Number, required: true},
    percent_change_24h: {type: Number, required: true},
    percent_change_7d: {type:Number, required: true},
    market_cap: {type: Number, required: true}
});

coinSchema.statics.addNewCoin = async function (data){
    const coin = await this.findOne({cmc_id: data.id})
    if(!coin) return this.create({
        cmc_id: data.id,
        name: data.name,
        symbol: data.symbol,
        slug: data.slug,
        price: data.quote.USD.price,
        percent_change_1h: data.quote.USD.percent_change_1h,
        percent_change_24h: data.quote.USD.percent_change_24h,
        percent_change_7d: data.quote.USD.percent_change_7d,
        market_cap: data.quote.USD.market_cap,
    })
    else return this.update({
        price: data.quote.USD.price,
        percent_change_1h: data.quote.USD.percent_change_1h,
        percent_change_24h: data.quote.USD.percent_change_24h,
        percent_change_7d: data.quote.USD.percent_change_7d,
        market_cap: data.quote.USD.market_cap,
    })
}

coinSchema.statics.getAll = async function (start, limit, search) {
    return await this.find()
    .or([
        {slug: {$regex: RegExp(search, 'i')}},
        {symbol: {$regex: RegExp(search, 'i')}},
    ])
    .skip(Number(start)-1)
    .limit(Number(limit))
    .sort({market_cap: -1});
}

coinSchema.statics.getMyCoins = async function(user_id){
    const userHolds = await Holding.getByUserId(user_id);
    let coins = [];
    for(let i = 0; i < userHolds.length; i++)coins.push({
        coin: await this.findOne({cmc_id: userHolds[i].coin_id}),
        hold: userHolds[i]
    });
    return coins;
}

coinSchema.statics.getMyCoin = async function(user_id, coin_id){
    let userHolds = await Holding.findOne({user_id, coin_id});
    if(!userHolds)userHolds = {
        user_id, 
        coin_id,
        value: 0
    }
    return userHolds;
}

module.exports = mongoose.model('Coin', coinSchema);