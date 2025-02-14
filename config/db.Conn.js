require('dotenv').config();

const { Model } = require('objection');
const Knex = require('knex');

const connectToDB = () => {
    const env = process.env.DB_ENV;

    // Use a ternary operator to determine the environment-specific configuration
    const host = env === 'LOCAL' ? process.env.DB_HOST_OFFICE : process.env.DB_HOST_PROD;
    const databaseName = env === 'LOCAL' ? process.env.DB_DATABASE_LOCAL : process.env.DB_DATABASE;

    // Create the Knex instance with optimized settings
    const knex = Knex({
        client: 'mysql2',
        connection: {
            host,
            port: process.env.DB_PORT || 3306, // Use a default MySQL port if not set
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: databaseName,
            connectTimeout: 10000, // Set a connection timeout of 10 seconds
        },
        pool: {
            min: 2, // Minimum number of connections in the pool
            max: 10, // Maximum number of connections in the pool
            acquireTimeoutMillis: 30000, // Time to wait for acquiring a connection
            idleTimeoutMillis: 60000, // Idle time before releasing connections
            reapIntervalMillis: 1000, // Time between reaping idle connections
        },
        debug: false, // Set to true for debugging SQL queries during development
    });

    // Test the database connection
    knex
        .raw('SELECT 1+1 AS result')
        .then(() => {
            console.log('Database connection successful!');
            // Bind the Knex instance to Objection.js
            Model.knex(knex);
        })
        .catch((err) => {
            console.error('Database connection error:', err.message);
        });

    // Handle database connection errors globally to prevent app crashes
    knex.on('error', (err) => {
        console.error('Knex error:', err);
    });

    // Return the Knex instance for further use if needed
    return knex;
};

module.exports = connectToDB;
