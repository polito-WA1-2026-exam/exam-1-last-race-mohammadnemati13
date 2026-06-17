/**
 * Last Race - Express Server
 *
 * Main backend entry point of the application.
 * This module configures authentication, session handling,
 * REST APIs and game lifecycle management.
 */

import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";

import passport from "./passport/passport.js";

import {
    getNetwork,
    getSegmentsList,
    pickStartAndDestination,
    computeGameResult,
    saveGame,
    getRanking
} from "./dao/game-dao.js";

const app = express();
const port = 3001;

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/**
 * Send authenticated user information.
 *
 * @param {*} user
 * @param {*} res
 */
function sendUser(user, res) {
    res.json({
        id: user.id,
        username: user.username
    });
}

/**
 * Middleware protecting authenticated routes.
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    return res.status(401).json({
        error: "Not authenticated"
    });
}

// ---------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------

app.use(morgan("dev"));

app.use(express.json());

app.use(
    session({
        secret: "last-race-secret",
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

// ---------------------------------------------------------------------
// Authentication APIs
// ---------------------------------------------------------------------

/**
 * Authenticate a user and create a session.
 */
app.post(
    "/api/sessions",
    passport.authenticate("local"),
    (req, res) => {
        sendUser(req.user, res);
    }
);

/**
 * Retrieve current authenticated user.
 */
app.get("/api/sessions/current", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: "Not authenticated"
        });
    }

    sendUser(req.user, res);
});

/**
 * Destroy current session.
 */
app.delete("/api/sessions/current", (req, res) => {
    req.logout(() => {
        res.status(200).end();
    });
});

// ---------------------------------------------------------------------
// Network APIs
// ---------------------------------------------------------------------

/**
 * Retrieve the complete metro network.
 */
app.get(
    "/api/network",
    isLoggedIn,
    async (req, res) => {
        try {
            const network = await getNetwork();
            res.json(network);
        }
        catch {
            res.status(500).json({
                error: "Cannot load network"
            });
        }
    }
);

/**
 * Retrieve all station pairs without line information.
 */
app.get(
    "/api/segments",
    isLoggedIn,
    async (req, res) => {
        try {
            const segments = await getSegmentsList();
            res.json(segments);
        }
        catch {
            res.status(500).json({
                error: "Cannot load segments"
            });
        }
    }
);

// ---------------------------------------------------------------------
// Game Lifecycle APIs
// ---------------------------------------------------------------------

/**
 * Start a new game.
 */
app.post(
    "/api/game/start",
    isLoggedIn,
    async (req, res) => {
        try {
            const {
                startStation,
                destinationStation
            } = await pickStartAndDestination();

            req.session.currentGame = {
                startId: startStation.id,
                destId: destinationStation.id
            };

            res.json({
                startStation,
                destinationStation
            });
        }
        catch {
            res.status(500).json({
                error: "Cannot start game"
            });
        }
    }
);

/**
 * Submit a route and execute the game.
 */
app.post(
    "/api/games",
    isLoggedIn,
    async (req, res) => {
        try {
            const currentGame =
                req.session.currentGame;

            if (!currentGame) {
                return res.status(400).json({
                    error: "No active game. Start a new game first."
                });
            }

            const rawRoute =
                Array.isArray(req.body.route)
                    ? req.body.route
                    : [];

            const route = rawRoute
                .filter(
                    segment =>
                        segment &&
                        segment.station1 !== undefined &&
                        segment.station2 !== undefined
                )
                .map(segment => ({
                    station1: Number(segment.station1),
                    station2: Number(segment.station2)
                }));

            const result =
                await computeGameResult(
                    route,
                    currentGame.startId,
                    currentGame.destId
                );

            if (result.valid) {
                await saveGame(
                    req.user.id,
                    result.finalScore,
                    JSON.stringify(route)
                );
            }

            delete req.session.currentGame;

            res.json(result);
        }
        catch (err) {
            console.error(err);

            res.status(500).json({
                error: "Cannot process game"
            });
        }
    }
);

/**
 * Retrieve ranking.
 */
app.get(
    "/api/ranking",
    isLoggedIn,
    async (req, res) => {
        try {
            const ranking = await getRanking();
            res.json(ranking);
        }
        catch {
            res.status(500).json({
                error: "Cannot load ranking"
            });
        }
    }
);

// ---------------------------------------------------------------------
// Server Startup
// ---------------------------------------------------------------------

app.listen(port, () => {
    console.log(
        `Server listening at http://localhost:${port}`
    );
});