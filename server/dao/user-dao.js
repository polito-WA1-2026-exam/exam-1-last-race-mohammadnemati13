/**
 * User DAO
 *
 * Data access functions used by Passport.js for:
 * - user authentication
 * - session restoration
 */

import db from "../database/db.js";

// ---------------------------------------------------------------------
// Database Helper
// ---------------------------------------------------------------------

/**
 * Execute a query returning a single row.
 *
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object>}
 */
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// ---------------------------------------------------------------------
// User Queries
// ---------------------------------------------------------------------

/**
 * Retrieve a user by username.
 *
 * Used during authentication to verify
 * the provided credentials.
 *
 * @param {string} username
 * @returns {Promise<Object>}
 */
function getUser(username) {
    return dbGet(
        `
            SELECT
                id,
                username,
                hash,
                salt
            FROM users
            WHERE username = ?
        `,
        [username]
    );
}

/**
 * Retrieve a user by id.
 *
 * Used by Passport.js when rebuilding the
 * authenticated user from the session.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
function getUserById(id) {
    return dbGet(
        `
            SELECT
                id,
                username,
                hash,
                salt
            FROM users
            WHERE id = ?
        `,
        [id]
    );
}

export {
    getUser,
    getUserById
};