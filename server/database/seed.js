/**
 * Database Seed Script
 *
 * Recreates the entire SQLite database from scratch and
 * populates it with the initial data required by the game.
 *
 * Seeded data includes:
 * - registered users
 * - metro lines
 * - stations
 * - network segments
 * - random events
 * - historical game results
 *
 * This script is intended for development and project setup.
 */

import crypto from "crypto";
import db from "./db.js";

db.serialize(() => {

    // ---------------------------------------------------------------------
    // Database Schema Creation
    // ---------------------------------------------------------------------

    // Remove existing tables to guarantee a clean database state.
    db.run("DROP TABLE IF EXISTS games");
    db.run("DROP TABLE IF EXISTS events");
    db.run("DROP TABLE IF EXISTS segments");
    db.run("DROP TABLE IF EXISTS stations");
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS lines");

    // Create application tables.
    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hash TEXT NOT NULL,
            salt TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE stations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `);

    db.run(`
        CREATE TABLE segments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station1_id INTEGER NOT NULL,
            station2_id INTEGER NOT NULL,
            line_id INTEGER NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            effect INTEGER NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            score INTEGER NOT NULL,
            route_json TEXT,
            played_at TEXT
        )
    `);

    // ---------------------------------------------------------------------
    // Seed Metro Lines
    // ---------------------------------------------------------------------

    const lines = [
        "Line 1",
        "Line 2",
        "Line 3",
        "Line 4"
    ];

    lines.forEach((line) => {
        db.run(
            "INSERT INTO lines(name) VALUES(?)",
            [line]
        );
    });

    // ---------------------------------------------------------------------
    // Seed Metro Stations
    // ---------------------------------------------------------------------

    const stations = [
        "Fermi",
        "Paradiso",
        "Marche",
        "Massaua",
        "Pozzo Strada",
        "Monte Grappa",
        "Rivoli",
        "Racconigi",
        "Bernini",
        "Principi d'Acaja",
        "XVIII Dicembre",
        "Porta Susa",
        "Porta Nuova",
        "Re Umberto",
    ];

    // ---------------------------------------------------------------------
    // Seed Registered Users
    // ---------------------------------------------------------------------

    const users = [
        {
            username: "alice",
            password: "alice"
        },
        {
            username: "bob",
            password: "bob"
        },
        {
            username: "charlie",
            password: "charlie"
        },
        {
            username: "mohammad",
            password: "mohammad"
        }
    ];

    // Passwords are stored using salted hashes generated
    // with Node.js scrypt for secure authentication.
    users.forEach((user) => {

        // Generate a unique salt for the user.
        const salt =
            crypto.randomBytes(16).toString("hex");

        // Derive the password hash using scrypt.
        const hash = crypto
            .scryptSync(user.password, salt, 32)
            .toString("hex");

        db.run(
            "INSERT INTO users(username, hash, salt) VALUES(?, ?, ?)",
            [
                user.username,
                hash,
                salt
            ]
        );

    });

    // Insert all metro stations into the database.
    stations.forEach((station) => {
        db.run(
            "INSERT INTO stations(name) VALUES(?)",
            [station]
        );
    });

    // ---------------------------------------------------------------------
    // Seed Random Events
    // ---------------------------------------------------------------------

    // Positive values increase the score,
    // negative values decrease it.
    const events = [
        ["Quiet Journey", 1],
        ["Found Coin", 2],
        ["Kind Passenger", 3],
        ["Express Connection", 4],
        ["Bad Passenger", -1],
        ["Wrong Platform", -2],
        ["Ticket Inspection", -3],
        ["Lost Wallet", -4],
    ];

    events.forEach((event) => {
        db.run(
            "INSERT INTO events(description, effect) VALUES(?, ?)",
            event
        );
    });

    // ---------------------------------------------------------------------
    // Seed Metro Network
    // ---------------------------------------------------------------------

    // Station ids, in insertion order:
    // 1 Fermi
    // 2 Paradiso
    // 3 Marche
    // 4 Massaua
    // 5 Pozzo Strada
    // 6 Monte Grappa
    // 7 Rivoli
    // 8 Racconigi
    // 9 Bernini
    // 10 Principi d'Acaja
    // 11 XVIII Dicembre
    // 12 Porta Susa
    // 13 Porta Nuova
    // 14 Re Umberto

    // Network definition:
    // [station1_id, station2_id, line_id]
    const segments = [

        // Line 1
        [1, 2, 1],
        [2, 3, 1],
        [3, 4, 1],
        [4, 5, 1],

        // Line 2
        [1, 6, 2],
        [6, 7, 2],
        [7, 8, 2],
        [8, 9, 2],

        // Line 3
        [3, 10, 3],
        [10, 11, 3],
        [11, 12, 3],
        [12, 13, 3],

        // Line 4
        [4, 14, 4],
        [14, 12, 4],
        [12, 9, 4],
    ];

    // Interchange stations (served by more than one line):
    // 1, 3, 4, 9, 12
    // This satisfies the project requirement of having at least
    // three interchange stations and no more than half of the network.

    // Insert all network connections.
    segments.forEach((segment) => {
        db.run(
            `
            INSERT INTO segments(
                station1_id,
                station2_id,
                line_id
            )
            VALUES (?, ?, ?)
            `,
            segment
        );
    });

    // ---------------------------------------------------------------------
    // Seed Historical Games
    // ---------------------------------------------------------------------

    // Pre-seeded completed games used to populate the ranking.
    // All routes are valid according to the network definition
    // and respect the line-continuity constraint.

    const games = [

        // alice: Line 1 route
        [
            1,
            25,
            JSON.stringify([
                { station1: 1, station2: 2 },
                { station1: 2, station2: 3 },
                { station1: 3, station2: 4 },
                { station1: 4, station2: 5 }
            ]),
            "2026-06-01T10:00:00.000Z"
        ],

        // alice: Line 2 route
        [
            1,
            22,
            JSON.stringify([
                { station1: 1, station2: 6 },
                { station1: 6, station2: 7 },
                { station1: 7, station2: 8 },
                { station1: 8, station2: 9 }
            ]),
            "2026-06-03T15:30:00.000Z"
        ],

        // bob: Line 3 route
        [
            2,
            24,
            JSON.stringify([
                { station1: 3, station2: 10 },
                { station1: 10, station2: 11 },
                { station1: 11, station2: 12 }
            ]),
            "2026-06-02T09:15:00.000Z"
        ],

        // bob: Line 4 route
        [
            2,
            19,
            JSON.stringify([
                { station1: 4, station2: 14 },
                { station1: 14, station2: 12 },
                { station1: 12, station2: 9 }
            ]),
            "2026-06-04T18:45:00.000Z"
        ],
    ];

    // Insert historical game results.
    games.forEach((game) => {
        db.run(
            `
            INSERT INTO games(
                user_id,
                score,
                route_json,
                played_at
            )
            VALUES (?, ?, ?, ?)
            `,
            game
        );
    });

    // Database initialization completed successfully.
    console.log("Seed completed");

});

// Close the database connection.
db.close();