/**
 * Database Configuration
 *
 * Creates and exports the SQLite database connection
 * used throughout the backend application.
 */

import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Recreate CommonJS __filename and __dirname variables.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path of the SQLite database file.
const dbPath = path.join(__dirname, "../railway.sqlite");

/**
 * SQLite database connection instance.
 */
const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {

        console.error(
            "Database connection error:",
            err.message
        );

    }
    else {

        console.log("Connected to SQLite database.");
        console.log("Database file:", dbPath);

    }

});

export default db;