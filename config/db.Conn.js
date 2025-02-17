require('dotenv').config();
const { Model } = require('objection');
const Knex = require('knex');

const connectToDB = () => {
    const env = process.env.DB_ENV;
    const host = env === 'LOCAL' ? process.env.DB_HOST_OFFICE : process.env.DB_HOST_PROD;
    const databaseName = env === 'LOCAL' ? process.env.DB_DATABASE_LOCAL : process.env.DB_DATABASE;

    const knex = Knex({
        client: 'mysql2',
        connection: {
            host,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: databaseName,
            connectTimeout: 30000, // Increased timeout to prevent connection issues
        },
        pool: {
            min: 2,
            max: 10,
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 5000,
        },
        debug: false,
    });

    knex
        .raw('SELECT 1+1 AS result')
        .then(() => {
            console.log('Database connection successful!');
            Model.knex(knex);
        })
        .catch((err) => {
            console.error('Database connection error:', err);
        });

    knex.on('error', (err) => {
        console.error('Knex error:', err);
        if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Reconnecting to MySQL...');
            connectToDB();
        }
    });

    // Keep-alive query to prevent MySQL from closing idle connections
    setInterval(async () => {
        try {
            await knex.raw('SELECT 1');
            console.log('Keep-alive query executed.');
        } catch (err) {
            console.error('Keep-alive query failed:', err);
        }
    }, 6000); // Every 60 seconds

    return knex;
};

module.exports = connectToDB;
