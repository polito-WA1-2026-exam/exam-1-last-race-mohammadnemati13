/**
 * Metro Map Component
 *
 * Reusable SVG-based metro map used in:
 *
 * - Setup Phase:
 *   displays the complete network with line colors.
 *
 * - Planning Phase:
 *   displays only station locations and the route
 *   progressively built by the player.
 */

import { stationPositions } from "./metroMapData";

function MetroMap({
                      segments,
                      startStation,
                      destinationStation,
                      route = [],
                      showFullNetwork = false
                  }) {

    /**
     * Collect all stations appearing in the
     * provided segment list.
     */
    const stations = new Map();

    segments.forEach(segment => {

        stations.set(
            segment.station1Id,
            segment.station1Name
        );

        stations.set(
            segment.station2Id,
            segment.station2Name
        );

    });

    /**
     * Official colors assigned to each metro line.
     */
    const lineColors = {
        1: "#1976d2",
        2: "#e53935",
        3: "#43a047",
        4: "#fbc02d"
    };

    return (

        <div className="border rounded bg-white p-3 shadow-sm">

            <svg
                viewBox="0 0 850 630"
                style={{
                    width: "100%",
                    maxWidth: "850px",
                    height: "auto"
                }}
            >

                {/* -------------------------------------------------- */}
                {/* Setup Phase: render the complete network           */}
                {/* -------------------------------------------------- */}

                {
                    showFullNetwork &&

                    segments.map(segment => {

                        const p1 =
                            stationPositions[
                                segment.station1Id
                                ];

                        const p2 =
                            stationPositions[
                                segment.station2Id
                                ];

                        return (
                            <line
                                key={segment.id}
                                x1={p1.x}
                                y1={p1.y}
                                x2={p2.x}
                                y2={p2.y}
                                stroke={
                                    lineColors[
                                        segment.lineId
                                        ] || "#444"
                                }
                                strokeWidth="6"
                                strokeLinecap="round"
                            />
                        );

                    })
                }

                {/* -------------------------------------------------- */}
                {/* Planning Phase: render only selected route         */}
                {/* -------------------------------------------------- */}

                {
                    !showFullNetwork &&

                    route.map((segment, index) => {

                        const p1 =
                            stationPositions[
                                segment.station1
                                ];

                        const p2 =
                            stationPositions[
                                segment.station2
                                ];

                        return (
                            <line
                                key={index}
                                x1={p1.x}
                                y1={p1.y}
                                x2={p2.x}
                                y2={p2.y}
                                stroke="#0d6efd"
                                strokeWidth="6"
                                strokeLinecap="round"
                            />
                        );

                    })
                }

                {/* -------------------------------------------------- */}
                {/* Render stations and labels                         */}
                {/* -------------------------------------------------- */}

                {
                    Array.from(stations.entries())
                        .map(([id, name]) => {

                            const pos =
                                stationPositions[id];

                            /**
                             * Highlight route endpoints
                             * during the Planning phase.
                             */
                            const isStart =
                                startStation?.id === id;

                            const isDestination =
                                destinationStation?.id === id;

                            return (

                                <g key={id}>

                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={
                                            isStart || isDestination
                                                ? 17
                                                : 16
                                        }
                                        fill={
                                            isStart
                                                ? "green"
                                                : isDestination
                                                    ? "red"
                                                    : "#666"
                                        }
                                    />

                                    <text
                                        x={pos.x}
                                        y={pos.y - 30}
                                        textAnchor="middle"
                                        fontSize="18"
                                        fontWeight="700"
                                    >
                                        {name}
                                    </text>

                                </g>

                            );

                        })
                }

            </svg>

        </div>

    );
}

export default MetroMap;