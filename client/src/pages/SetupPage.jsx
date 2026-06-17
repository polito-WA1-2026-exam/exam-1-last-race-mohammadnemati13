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
import metroMap from "../assets/metro-map.png";

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

            <img
                src={metroMap}
                alt="Metro Map"
                className="img-fluid mb-4"
            />

            <button
                className="btn btn-success mb-4"
                disabled={loading}
                onClick={() => navigate("/planning")}
            >
                Start Planning
            </button>

            {error && (
                <p className="text-danger">
                    {error}
                </p>
            )}

            {loading ? (
                <p>Loading network...</p>
            ) : (
                <table className="table table-striped">

                    <thead>
                    <tr>
                        <th>Station A</th>
                        <th>Station B</th>
                        <th>Line</th>
                    </tr>
                    </thead>

                    <tbody>

                    {network.map((segment) => (
                        <tr key={segment.id}>
                            <td>{segment.station1}</td>
                            <td>{segment.station2}</td>
                            <td>{segment.line}</td>
                        </tr>
                    ))}

                    </tbody>

                </table>
            )}

        </div>
    );

}

export default SetupPage;