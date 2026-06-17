/**
 * Ranking Page
 *
 * Displays the global ranking based on the
 * highest score achieved by each registered user.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRanking } from "../API";

function RankingPage() {

    const navigate = useNavigate();

    const [ranking, setRanking] = useState([]);
    const [error, setError] = useState("");

    /**
     * Load the ranking when the page is mounted.
     */
    useEffect(() => {

        const loadRanking = async () => {

            try {

                const data = await getRanking();
                setRanking(data);

            }
            catch {

                setError("Cannot load ranking");

            }

        };

        loadRanking();

    }, []);

    return (
        <div className="container mt-5">

            <h1>
                Ranking
            </h1>

            {error && (
                <p className="text-danger">
                    {error}
                </p>
            )}

            {ranking.length === 0 && !error ? (
                <p>
                    No ranking data available.
                </p>
            ) : (
                <table className="table">

                    <thead>
                    <tr>
                        <th>User</th>
                        <th>Score</th>
                    </tr>
                    </thead>

                    <tbody>

                    {ranking.map((player) => (
                        <tr key={player.username}>
                            <td>{player.username}</td>
                            <td>{player.score}</td>
                        </tr>
                    ))}

                    </tbody>

                </table>
            )}

            <div className="text-center mt-4">

                <button
                    className="btn btn-success"
                    onClick={() => navigate("/")}
                >
                    Try Again
                </button>

            </div>

        </div>
    );

}

export default RankingPage;