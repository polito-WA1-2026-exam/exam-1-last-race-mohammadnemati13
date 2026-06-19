/**
 * Setup Page
 *
 * During this phase the player can inspect the complete
 * metro network, including line information, in order to
 * memorize stations and connections before planning a route.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getNetwork } from "../API";
import MetroMap from "../components/MetroMap";

function SetupPage() {
    const navigate = useNavigate();

    const [network, setNetwork] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    /**
     * Load the complete metro network when the page is mounted.
     */
    useEffect(() => {

        const loadNetwork = async () => {

            try {

                const data = await getNetwork();
                setNetwork(data);
            }
            catch {

                setError("Cannot load the network");

            }
            finally {

                setLoading(false);

            }

        };

        loadNetwork();

    }, []);

    return (
        <div className="container mt-5">

            <h1>Setup Phase</h1>

            <h4 className="mt-4">
                Memorize the network
            </h4>

            <p className="text-muted">
                Take as much time as you need, then press
                {" "}
                <strong>Start Planning</strong>
                {" "}
                when you are ready. The next phase is timed.
            </p>
            {/* Full network visualization used during the memorization phase. */}
            {
                loading ? (
                    <p>Loading network...</p>
                ) : (
                    <MetroMap
                        segments={network}
                        route={[]}
                        showFullNetwork={true}
                    />
                )
            }

            <button
                className="btn btn-success mt-4 mb-4"
                disabled={loading}
                onClick={() => {
                    sessionStorage.setItem("planningFromSetup", "true");
                    navigate("/planning");
                }}
            >
                Start Planning
            </button>

            {error && (
                <p className="text-danger">
                    {error}
                </p>
            )}

        </div>
    );

}

export default SetupPage;