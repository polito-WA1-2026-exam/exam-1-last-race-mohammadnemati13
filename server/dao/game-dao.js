/**
 * Last Race - Game DAO
 *
 * Database access layer and core game logic:
 * - metro network retrieval
 * - route validation
 * - start/destination generation
 * - event execution
 * - score calculation
 * - ranking management
 */

import db from "../database/db.js";

// ---------------------------------------------------------------------
// Database Helpers
// ---------------------------------------------------------------------

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// ---------------------------------------------------------------------
// Read-Only Queries
// ---------------------------------------------------------------------

/**
 * Retrieve the complete metro network.
 *
 * Each returned segment contains:
 * - both endpoint stations
 * - the line identifier
 * - the line name
 *
 * Used during the Setup phase to display
 * the full metro map with line information.
 *
 * @returns {Promise<Array>}
 */
function getNetwork() {
    const sql = `
        SELECT
            segments.id,

            s1.id AS station1Id,
            s1.name AS station1Name,

            s2.id AS station2Id,
            s2.name AS station2Name,

            segments.line_id AS lineId,
            lines.name AS line
        FROM segments
                 JOIN stations s1
                      ON segments.station1_id = s1.id
                 JOIN stations s2
                      ON segments.station2_id = s2.id
                 JOIN lines
                      ON segments.line_id = lines.id
    `;

    return dbAll(sql);
}

/**
 * Retrieve all available station pairs without line information.
 *
 * Used during the Planning phase.
 *
 * @returns {Promise<Array>}
 */
function getSegmentsList() {
    const sql = `
        SELECT
            segments.id,
            s1.id AS station1Id,
            s1.name AS station1Name,
            s2.id AS station2Id,
            s2.name AS station2Name
        FROM segments
                 JOIN stations s1
                      ON segments.station1_id = s1.id
                 JOIN stations s2
                      ON segments.station2_id = s2.id
    `;

    return dbAll(sql);
}

/**
 * Retrieve raw segment data used internally
 * by graph and validation algorithms.
 *
 * @returns {Promise<Array>}
 */
function getAllSegmentsRaw() {
    return dbAll(
        "SELECT station1_id, station2_id, line_id FROM segments"
    );
}

/**
 * Retrieve all stations.
 *
 * @returns {Promise<Array>}
 */
function getAllStationsInternal() {
    return dbAll(
        "SELECT id, name FROM stations"
    );
}

/**
 * Retrieve all available events.
 *
 * @returns {Promise<Array>}
 */
function getAllEventsInternal() {
    return dbAll(
        "SELECT * FROM events"
    );
}

// ---------------------------------------------------------------------
// Graph Helpers
// ---------------------------------------------------------------------

/**
 * Build an undirected adjacency list representation
 * of the metro network.
 *
 * @param {Array} segmentsRaw
 * @returns {Map<number, number[]>}
 */
function buildAdjacency(segmentsRaw) {
    const adjacency = new Map();

    for (const { station1_id, station2_id } of segmentsRaw) {
        if (!adjacency.has(station1_id))
            adjacency.set(station1_id, []);

        if (!adjacency.has(station2_id))
            adjacency.set(station2_id, []);

        adjacency.get(station1_id).push(station2_id);
        adjacency.get(station2_id).push(station1_id);
    }

    return adjacency;
}

/**
 * Compute shortest-path distances using BFS.
 *
 * Uses a pointer instead of Array.shift()
 * to avoid O(n) queue operations.
 *
 * @param {number} startId
 * @param {Map<number, number[]>} adjacency
 * @returns {Map<number, number>}
 */
function bfsDistances(startId, adjacency) {
    const distances = new Map([[startId, 0]]);
    const queue = [startId];

    let head = 0;

    while (head < queue.length) {
        const current = queue[head++];
        const neighbors = adjacency.get(current) || [];

        for (const next of neighbors) {
            if (distances.has(next))
                continue;

            distances.set(
                next,
                distances.get(current) + 1
            );

            queue.push(next);
        }
    }

    return distances;
}

/**
 * Build a map:
 *
 * stationId -> Set(lineIds)
 *
 * Stations associated with multiple lines
 * are interchange stations.
 *
 * @param {Array} segmentsRaw
 * @returns {Map<number, Set<number>>}
 */
function buildStationLinesMap(segmentsRaw) {
    const stationLines = new Map();

    for (const {
        station1_id,
        station2_id,
        line_id
    } of segmentsRaw) {

        for (const stationId of [station1_id, station2_id]) {
            if (!stationLines.has(stationId))
                stationLines.set(stationId, new Set());

            stationLines.get(stationId).add(line_id);
        }
    }

    return stationLines;
}

/**
 * Find all line identifiers connecting
 * two given stations.
 *
 * @param {number} station1
 * @param {number} station2
 * @param {Array} segmentsRaw
 * @returns {number[]}
 */
function findLinesForPair(station1, station2, segmentsRaw) {
    return segmentsRaw
        .filter(
            ({ station1_id, station2_id }) =>
                (
                    station1_id === station1 &&
                    station2_id === station2
                ) ||
                (
                    station1_id === station2 &&
                    station2_id === station1
                )
        )
        .map(({ line_id }) => line_id);
}

// ---------------------------------------------------------------------
// Start / Destination Selection
// ---------------------------------------------------------------------

/**
 * Select a random start station and destination station.
 *
 * The destination must be reachable from the start station
 * with a minimum topological distance of three segments.
 *
 * @returns {Promise<Object>}
 */
async function pickStartAndDestination() {
    const segmentsRaw = await getAllSegmentsRaw();
    const stations = await getAllStationsInternal();

    const adjacency = buildAdjacency(segmentsRaw);

    const stationIds =
        stations.map(({ id }) => id);

    const stationNameById =
        new Map(
            stations.map(({ id, name }) => [id, name])
        );

    const shuffledStarts = [...stationIds];

    for (let i = shuffledStarts.length - 1; i > 0; i--) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [shuffledStarts[i], shuffledStarts[j]] = [
            shuffledStarts[j],
            shuffledStarts[i]
        ];
    }

    for (const startId of shuffledStarts) {
        const distances =
            bfsDistances(startId, adjacency);

        const candidates =
            [...distances.entries()]
                .filter(([, distance]) => distance >= 3)
                .map(([stationId]) => stationId);

        if (candidates.length === 0)
            continue;

        const destId =
            candidates[
                Math.floor(
                    Math.random() * candidates.length
                )
                ];

        return {
            startStation: {
                id: startId,
                name: stationNameById.get(startId)
            },
            destinationStation: {
                id: destId,
                name: stationNameById.get(destId)
            }
        };
    }

    throw new Error(
        "No valid start/destination pair found in the network"
    );
}
// ---------------------------------------------------------------------
// Route Validation
// ---------------------------------------------------------------------

/**
 * Validate a route submitted by the player.
 *
 * Validation rules:
 * - the route must start from the assigned start station
 * - the route must end at the assigned destination station
 * - consecutive segments must form a continuous path
 * - a segment cannot be reused
 * - line changes are only allowed at interchange stations
 *
 * The server is the authoritative source of validation;
 * client-side validation is never trusted.
 *
 * @param {Array} route
 * @param {number} startId
 * @param {number} destId
 * @returns {Promise<boolean>}
 */
async function validateRoute(route, startId, destId) {
    if (!Array.isArray(route) || route.length === 0)
        return false;

    if (route[0].station1 !== startId)
        return false;

    if (route[route.length - 1].station2 !== destId)
        return false;

    const segmentsRaw = await getAllSegmentsRaw();
    const stationLines = buildStationLinesMap(segmentsRaw);

    const usedPairs = new Set();

    let previousLine = null;

    for (let i = 0; i < route.length; i++) {
        const segment = route[i];

        if (
            i > 0 &&
            segment.station1 !== route[i - 1].station2
        ) {
            return false;
        }

        const pairKey =
            [segment.station1, segment.station2]
                .sort((a, b) => a - b)
                .join("-");

        if (usedPairs.has(pairKey))
            return false;

        usedPairs.add(pairKey);

        const candidateLines =
            findLinesForPair(
                segment.station1,
                segment.station2,
                segmentsRaw
            );

        if (candidateLines.length === 0)
            return false;

        let chosenLine;

        if (
            previousLine !== null &&
            candidateLines.includes(previousLine)
        ) {
            chosenLine = previousLine;
        }
        else if (previousLine !== null) {
            const pivotStation = segment.station1;

            const linesAtPivot =
                stationLines.get(pivotStation) ||
                new Set();

            if (linesAtPivot.size <= 1)
                return false;

            chosenLine = candidateLines[0];
        }
        else {
            chosenLine = candidateLines[0];
        }

        previousLine = chosenLine;
    }

    return true;
}

// ---------------------------------------------------------------------
// Game Execution
// ---------------------------------------------------------------------

/**
 * Execute a complete game simulation.
 *
 * After validating the route, the server generates
 * one random event for each traveled segment and
 * computes the final score.
 *
 * All game logic is executed server-side to prevent
 * client-side score manipulation.
 *
 * @param {Array} route
 * @param {number} startId
 * @param {number} destId
 * @returns {Promise<Object>}
 */
async function computeGameResult(route, startId, destId) {
    const valid =
        await validateRoute(route, startId, destId);

    if (!valid) {
        return {
            valid: false,
            finalScore: 0,
            steps: []
        };
    }

    const events = await getAllEventsInternal();
    const stations = await getAllStationsInternal();

    const stationNameById =
        new Map(
            stations.map(({ id, name }) => [id, name])
        );

    const goodEvents =
        events.filter(event => event.effect >= 0);

    const badEvents =
        events.filter(event => event.effect < 0);

    let score = 20;

    const steps = [];

    route.forEach((segment, index) => {
        const pool =
            index < 4
                ? (
                    Math.random() < 0.7
                        ? goodEvents
                        : badEvents
                )
                : (
                    Math.random() < 0.7
                        ? badEvents
                        : goodEvents
                );

        const event =
            pool[
                Math.floor(
                    Math.random() * pool.length
                )
                ];

        score += event.effect;

        steps.push({
            step: index + 1,
            station1Name:
                stationNameById.get(segment.station1),
            station2Name:
                stationNameById.get(segment.station2),
            eventDescription: event.description,
            eventEffect: event.effect,
            scoreAfterStep: score
        });
    });

    return {
        valid: true,
        finalScore: Math.max(0, score),
        steps
    };
}

// ---------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------

/**
 * Persist a completed game into the database.
 *
 * The route is stored as JSON together with the final score
 * and the completion timestamp.
 *
 * @param {number} userId
 * @param {number} score
 * @param {string} routeJson
 * @returns {Promise<number>}
 */
function saveGame(userId, score, routeJson) {
    return new Promise((resolve, reject) => {
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
            [
                userId,
                score,
                routeJson,
                new Date().toISOString()
            ],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

/**
 * Retrieve the ranking of registered users.
 *
 * For each user, only the highest score achieved
 * across all completed games is considered.
 *
 * Results are ordered from highest score to lowest score.
 *
 * @returns {Promise<Array>}
 */
function getRanking() {
    const sql = `
        SELECT
            users.username,
            MAX(games.score) AS score
        FROM games
        JOIN users
            ON games.user_id = users.id
        GROUP BY users.id
        ORDER BY score DESC
    `;

    return dbAll(sql);
}

export {
    getNetwork,
    getSegmentsList,
    pickStartAndDestination,
    computeGameResult,
    saveGame,
    getRanking
};