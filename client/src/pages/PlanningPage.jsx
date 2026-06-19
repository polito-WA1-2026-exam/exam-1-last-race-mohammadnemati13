/**
 * Planning Page
 *
 * During this phase the player receives a start station,
 * a destination station and the list of available segments.
 *
 * The player must reconstruct a valid route before the
 * countdown timer expires.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSegments, startGame, submitRoute } from "../API";
import MetroMap from "../components/MetroMap";

const PLANNING_SECONDS = 90;

function PlanningPage() {

    const navigate = useNavigate();

    /**
     * Read and consume the navigation flag once at
     * component initialisation time.
     *
     * A ref is used because React StrictMode re-runs
     * effects in development; reading inside an effect
     * would fail on the second invocation.
     */
    const cameFromSetupRef = useRef(() => {
        const flag = sessionStorage.getItem("planningFromSetup");
        if (flag) {
            sessionStorage.removeItem("planningFromSetup");
        }
        return !!flag;
    });

    // Evaluate the initialiser once
    const cameFromSetup = useMemo(
        () => cameFromSetupRef.current(),
        []
    );

    /**
     * If the page is reached via hard refresh (no navigation flag),
     * redirect to the setup page so the user goes through the
     * memorization phase again.
     */
    useEffect(() => {

        if (!cameFromSetup) {
            navigate("/setup", { replace: true });
        }

    }, [cameFromSetup, navigate]);

    const [segments, setSegments] = useState([]);
    const [startStation, setStartStation] = useState(null);
    const [destinationStation, setDestinationStation] = useState(null);
    const [route, setRoute] = useState([]);
    const [seconds, setSeconds] = useState(PLANNING_SECONDS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Guards against the manual Submit button and the timer expiry
    // both triggering a route submission.
    const submittedRef = useRef(false);

    /**
     * Load the generated game and the available segments
     * when the Planning phase starts.
     */
    useEffect(() => {

        const loadData = async () => {

            try {

                const gameData = await startGame();
                const segmentsData = await getSegments();

                setStartStation(gameData.startStation);
                setDestinationStation(gameData.destinationStation);
                setSegments(segmentsData);

            }
            catch {

                setError("Cannot load game data");

            }
            finally {

                setLoading(false);

            }

        };

        loadData();

    }, []);

    /**
     * Submit the currently built route to the server.
     *
     * If the route is valid, the Execution phase starts.
     * Otherwise, the game ends with a failed result.
     */
    const handleSubmit = async (currentRoute) => {

        if (submittedRef.current) {
            return;
        }

        submittedRef.current = true;

        try {

            const result = await submitRoute(currentRoute);

            if (result.valid) {

                navigate("/execution", {
                    state: {
                        steps: result.steps,
                        finalScore: result.finalScore
                    }
                });

            }
            else {

                navigate("/result", {
                    state: {
                        score: 0,
                        success: false
                    }
                });

            }

        }
        catch {

            navigate("/result", {
                state: {
                    score: 0,
                    success: false
                }
            });

        }

    };

    /**
     * Manage the Planning phase countdown.
     *
     * When the timer reaches zero, the currently
     * built route is automatically submitted.
     */
    useEffect(() => {

        if (loading) {
            return;
        }

        if (seconds <= 0) {
            handleSubmit(route);
            return;
        }

        const timer = setTimeout(() => {
            setSeconds((s) => s - 1);
        }, 1000);

        return () => clearTimeout(timer);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seconds, loading]);

    /**
     * Fast lookup table used to convert station identifiers
     * into station names when rendering the selected route.
     */
    const stationNameById = useMemo(() => {

        const map = new Map();

        segments.forEach((s) => {
            map.set(s.station1Id, s.station1Name);
            map.set(s.station2Id, s.station2Name);
        });

        return map;

    }, [segments]);

    /**
     * Current station reached by the player.
     *
     * If no segment has been selected yet, the current
     * position corresponds to the assigned start station.
     */
    const currentPosition =
        route.length === 0
            ? startStation?.id
            : route[route.length - 1].station2;

    /**
     * Track already selected segments so that they
     * cannot be reused while building a route.
     */
    const usedPairKeys = useMemo(() => {

        return new Set(
            route.map((segment) =>
                [segment.station1, segment.station2]
                    .sort((a, b) => a - b)
                    .join("-")
            )
        );

    }, [route]);

    /**
     * Append a segment to the current route.
     *
     * All unused segments can be selected regardless
     * of whether they connect to the current position.
     * The server performs final validation.
     */
    const handleAddSegment = (segment) => {

        const from = currentPosition;

        // Always orient the segment: from -> to
        const to =
            segment.station1Id === from
                ? segment.station2Id
                : segment.station1Id;

        setRoute((oldRoute) => [
            ...oldRoute,
            {
                station1: from,
                station2: to
            }
        ]);

    };

    /**
     * Remove the most recently selected segment.
     */
    const handleUndo = () => {
        setRoute((oldRoute) => oldRoute.slice(0, -1));
    };

    /**
     * Build a set of valid segment pair keys from the
     * segments list, so we can verify connectivity.
     */
    const validPairKeys = useMemo(() => {

        const set = new Set();

        segments.forEach((s) => {
            const key = [s.station1Id, s.station2Id]
                .sort((a, b) => a - b)
                .join("-");
            set.add(key);
        });

        return set;

    }, [segments]);

    /**
     * Validate each step of the built route and
     * produce per-step feedback.
     *
     * This is a client-side hint only. The server
     * remains the authoritative validator.
     */
    const routeValidation = useMemo(() => {

        if (route.length === 0) {
            return { steps: [], startOk: true, endOk: true };
        }

        const steps = route.map((segment, index) => {

            // Check continuity: does this segment connect
            // to the previous one?
            const continuityOk =
                index === 0
                    ? segment.station1 === startStation?.id
                    : segment.station1 === route[index - 1].station2;

            // Check existence: is this pair a real segment?
            const pairKey =
                [segment.station1, segment.station2]
                    .sort((a, b) => a - b)
                    .join("-");

            const segmentExists = validPairKeys.has(pairKey);

            return {
                continuityOk,
                segmentExists,
                valid: continuityOk && segmentExists
            };

        });

        const startOk =
            route[0].station1 === startStation?.id;

        const endOk =
            route[route.length - 1].station2 === destinationStation?.id;

        return { steps, startOk, endOk };

    }, [route, startStation, destinationStation, validPairKeys]);

    if (loading) {
        return (
            <div className="container mt-5">
                <h1>Planning Phase</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (

        <div className="container mt-5">

            <div className="mb-4">

                <h1>Planning Phase</h1>

                <div className="d-flex gap-5 fs-5 mt-3">

                    <div>
                        <strong>Time Left:</strong> {seconds}s
                    </div>

                    <div>
                        <strong>Start:</strong> {startStation?.name}
                    </div>

                    <div>
                        <strong>Destination:</strong> {destinationStation?.name}
                    </div>

                </div>

            </div>

            {error && (
                <p className="text-danger">
                    {error}
                </p>
            )}
            <div className="mb-4">


                <p className="text-muted">
                    Pairs of stations connected to each other.
                    The line each segment belongs to is intentionally
                    not shown - use what you memorized during the
                    Setup phase.
                </p>

            </div>

            <div className="row">

                {/* Built Route */}

                <div className="col-md-3">

                    <h5>Built Route</h5>

                    <div
                        className="border rounded p-3 bg-white"
                        style={{
                            height: "345px",
                            overflowY: "auto"
                        }}
                    >

                        {route.length === 0 ? (

                            <p className="text-muted">
                                No segment selected yet.
                            </p>

                        ) : (

                            <>

                                <ol>

                                    {route.map((segment, index) => {

                                        const stepInfo =
                                            routeValidation.steps[index];

                                        const isValid = stepInfo?.valid;

                                        return (

                                            <li
                                                key={index}
                                                style={{
                                                    color: isValid
                                                        ? "inherit"
                                                        : "#dc3545"
                                                }}
                                            >

                                                {stationNameById.get(segment.station1)}
                                                {" -> "}
                                                {stationNameById.get(segment.station2)}

                                                {!stepInfo?.continuityOk && (
                                                    <small className="d-block text-danger">
                                                        ✗ Not connected to previous step
                                                    </small>
                                                )}

                                                {!stepInfo?.segmentExists && (
                                                    <small className="d-block text-danger">
                                                        ✗ This path does not exist
                                                    </small>
                                                )}

                                                {stepInfo?.valid && (
                                                    <small className="d-block text-success">
                                                        ✓ Valid connection
                                                    </small>
                                                )}

                                            </li>

                                        );

                                    })}

                                </ol>

                                {/* Route-level summary */}

                                {!routeValidation.startOk && (
                                    <div className="text-danger small mt-1">
                                        ✗ Route does not start from {startStation?.name}
                                    </div>
                                )}

                                {routeValidation.startOk &&
                                 !routeValidation.endOk && (
                                    <div className="text-warning small mt-1">
                                        ⚠ Route does not yet reach {destinationStation?.name}
                                    </div>
                                )}

                                {routeValidation.startOk &&
                                 routeValidation.endOk &&
                                 routeValidation.steps.every(s => s.valid) && (
                                    <div className="text-success small mt-1 fw-bold">
                                        ✓ Route looks valid!
                                    </div>
                                )}

                            </>

                        )}

                    </div>

                    <div className="mt-3">

                        <button
                            className="btn btn-secondary me-2"
                            onClick={handleUndo}
                            disabled={route.length === 0}
                        >
                            Undo Last
                        </button>

                        <button
                            className="btn btn-success"
                            onClick={() => handleSubmit(route)}
                        >
                            Submit Route
                        </button>

                    </div>

                </div>

                {/* Available Segments */}

                <div className="col-md-3">
                    <h5>Available Segments</h5>

                    <div
                        className="border rounded bg-white"
                        style={{
                            height: "400px",
                            overflowY: "auto"
                        }}
                    >

                        <ul className="list-group list-group-flush">

                            {segments.map((segment) => {

                                const pairKey =
                                    [segment.station1Id, segment.station2Id]
                                        .sort((a, b) => a - b)
                                        .join("-");

                                const used =
                                    usedPairKeys.has(pairKey);

                                return (

                                    <li
                                        key={segment.id}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                    >

                                        <span
                                            className={
                                                used
                                                    ? "text-muted text-decoration-line-through"
                                                    : ""
                                            }
                                        >
                                            {segment.station1Name}
                                            {" - "}
                                            {segment.station2Name}
                                        </span>

                                        <button
                                            className={
                                                used
                                                    ? "btn btn-sm btn-outline-secondary"
                                                    : "btn btn-sm btn-success"
                                            }
                                            disabled={used}
                                            onClick={() =>
                                                handleAddSegment(segment)
                                            }
                                        >
                                            Use
                                        </button>

                                    </li>

                                );

                            })}

                        </ul>

                    </div>

                </div>

                {/* Metro Map */}

                <div className="col-md-6">
                    <h5>Map</h5>

                    <MetroMap
                        segments={segments}
                        startStation={startStation}
                        destinationStation={destinationStation}
                        route={route}
                    />

                </div>

            </div>

        </div>

    );

}

export default PlanningPage;