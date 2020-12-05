const loadMongoDB = function(){
    mongodbUrl = process.env.NODE_ENV==='test'?process.env.MONGODB_URL_TEST:process.env.MONGODB_URL
    const mongoose = require('mongoose');
    mongoose.connect(mongodbUrl, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
    const db = mongoose.connection;
    db.once('open', () => {
        console.log('MongoDB connected');
    });
    db.on('error', (error) => {
        console.log(error);
    });
}

module.exports = loadMongoDB()