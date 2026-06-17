/**
 * Result Page
 *
 * Displays the final outcome of the game together with
 * the player's final score.
 */

import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {

    const location = useLocation();
    const navigate = useNavigate();

    // Data received from the previous game phase.
    const score = location.state?.score ?? 0;
    const success = location.state?.success ?? false;

    const resultMessage = success
        ? "You reached the destination!"
        : "Wrong route! Game Over!";

    return (
        <div className="container mt-5">

            <h1>
                Game Finished
            </h1>

            <h3>
                {resultMessage}
            </h3>

            <h4>
                Final Score: {score}
            </h4>

            <div className="mt-3">

                <button
                    className="btn btn-success me-2"
                    onClick={() => navigate("/")}
                >
                    Try Again
                </button>

                {success && (
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/ranking")}
                    >
                        Show Ranking
                    </button>
                )}

            </div>

        </div>
    );

}

export default ResultPage;