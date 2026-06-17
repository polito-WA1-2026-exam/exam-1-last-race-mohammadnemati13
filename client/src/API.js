/**
 * Client API Layer
 *
 * Centralizes all HTTP requests exchanged between
 * the React client and the Express backend.
 */

const SERVER_URL = "http://localhost:3001";

/**
 * Generic helper used to perform API requests.
 *
 * @param {string} endpoint
 * @param {object} options
 * @param {string} errorMessage
 * @returns {Promise<any>}
 */
async function apiRequest(
    endpoint,
    options = {},
    errorMessage = "Request failed"
) {

    const response = await fetch(
        `${SERVER_URL}${endpoint}`,
        {
            credentials: "include",
            ...options
        }
    );

    if (!response.ok) {
        throw new Error(errorMessage);
    }

    // Some endpoints return an empty response body.
    if (response.status === 204) {
        return;
    }

    const contentType =
        response.headers.get("content-type");

    if (
        contentType &&
        contentType.includes("application/json")
    ) {
        return response.json();
    }

    return;

}

/**
 * Authenticate a user and create a new session.
 *
 * @param {{username: string, password: string}} credentials
 * @returns {Promise<Object>}
 */
function login(credentials) {

    return apiRequest(
        "/api/sessions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
        },
        "Login failed"
    );

}

/**
 * Destroy the current authenticated session.
 *
 * @returns {Promise<void>}
 */
function logout() {

    return apiRequest(
        "/api/sessions/current",
        {
            method: "DELETE"
        },
        "Logout failed"
    );

}

/**
 * Retrieve the currently authenticated user.
 *
 * @returns {Promise<Object>}
 */
function getCurrentUser() {

    return apiRequest(
        "/api/sessions/current",
        {},
        "Not authenticated"
    );

}

/**
 * Retrieve the complete metro network.
 *
 * Used during the Setup phase.
 *
 * @returns {Promise<Array>}
 */
function getNetwork() {

    return apiRequest(
        "/api/network",
        {},
        "Cannot load network"
    );

}

/**
 * Retrieve all available station pairs.
 *
 * Used during the Planning phase.
 *
 * @returns {Promise<Array>}
 */
function getSegments() {

    return apiRequest(
        "/api/segments",
        {},
        "Cannot load segments"
    );

}

/**
 * Start a new game session.
 *
 * @returns {Promise<Object>}
 */
function startGame() {

    return apiRequest(
        "/api/game/start",
        {
            method: "POST"
        },
        "Cannot start game"
    );

}

/**
 * Submit the route built by the player.
 *
 * @param {Array} route
 * @returns {Promise<Object>}
 */
function submitRoute(route) {

    return apiRequest(
        "/api/games",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ route })
        },
        "Cannot submit route"
    );

}

/**
 * Retrieve the global ranking.
 *
 * @returns {Promise<Array>}
 */
function getRanking() {

    return apiRequest(
        "/api/ranking",
        {},
        "Cannot load ranking"
    );

}

export {
    login,
    logout,
    getCurrentUser,
    getNetwork,
    getSegments,
    startGame,
    submitRoute,
    getRanking
};