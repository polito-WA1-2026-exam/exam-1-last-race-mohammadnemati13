/**
 * Instructions Page
 *
 * Displays the game rules and provides access
 * to the game according to the authentication state.
 */

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function InstructionsPage() {

    const navigate = useNavigate();

    const { user, loading } = useAuth();

    const authenticated = !!user;

    return (
        <div className="container mt-5">

            <h1>Last Race</h1>

            <h3 className="mt-4">
                Instructions
            </h3>

            <ul className="mt-3">

                <li>
                    Memorize the metro network during the Setup phase.
                </li>

                <li>
                    Build a valid route from the assigned start station
                    to the destination station.
                </li>

                <li>
                    The Planning phase is limited to 90 seconds.
                </li>

                <li>
                    Station pairs are shown, but line information is hidden.
                </li>

                <li>
                    Line changes are only allowed at interchange stations.
                </li>

                <li>
                    Random events affect the score during the journey.
                </li>

                <li>
                    After four traveled segments, negative events become
                    more likely.
                </li>

                <li>
                    Reach the destination with the highest score possible.
                </li>

            </ul>

            {!loading && (
                <button
                    className="btn btn-primary mt-3"
                    onClick={() =>
                        navigate(
                            authenticated
                                ? "/setup"
                                : "/login"
                        )
                    }
                >
                    {authenticated
                        ? "Play"
                        : "Login to Play"}
                </button>
            )}

        </div>
    );

}

export default InstructionsPage;