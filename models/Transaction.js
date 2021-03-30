const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    type: {type: String, required: true},
    coin_id: {type: Number, required: true},
    coin_symbol: {type: String, required: true},
    user_id: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    amount: {type: Number, required: true},
    price: {type: Number, required: true},
    created_at: {type: Date, required: true, default: Date.now()}
});

module.exports = mongoose.model('Transaction', transactionSchema);