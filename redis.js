require('dotenv').config()
const redis = require("async-redis");

const client = redis.createClient(
    process.env.REDIS_URL?{
        url: process.env.REDIS_URL
    }:{
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }
);
 
// client.on("error", error => console.log(error));

client.on('connect', () => console.log('Redis connected'));

module.exports = client;