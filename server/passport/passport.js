/**
 * Passport Configuration
 *
 * This module configures Passport.js authentication using
 * a Local Strategy and session-based authentication.
 */

import crypto from "crypto";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import {
    getUser,
    getUserById
} from "../dao/user-dao.js";

// ---------------------------------------------------------------------
// Local Strategy
// ---------------------------------------------------------------------

/**
 * Authenticate a user using username and password.
 *
 * The submitted password is hashed using the user's
 * stored salt and compared against the stored hash.
 */
passport.use(
    new LocalStrategy(
        async (username, password, done) => {
            try {
                const user =
                    await getUser(username);

                if (!user)
                    return done(null, false);

                const hash = crypto
                    .scryptSync(
                        password,
                        user.salt,
                        32
                    )
                    .toString("hex");

                if (hash !== user.hash)
                    return done(null, false);

                return done(null, user);
            }
            catch (err) {
                return done(err);
            }
        }
    )
);

// ---------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------

/**
 * Store the authenticated user identifier
 * inside the session.
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

/**
 * Rebuild the authenticated user object
 * from the identifier stored in the session.
 */
passport.deserializeUser(
    async (id, done) => {
        try {
            const user =
                await getUserById(id);

            done(null, user);
        }
        catch (err) {
            done(err);
        }
    }
);

export default passport;