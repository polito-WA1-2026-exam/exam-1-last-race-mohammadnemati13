/**
 * Header Component
 *
 * Displays authenticated user information,
 * navigation shortcuts and logout functionality.
 */

import {useNavigate} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Header() {

    const navigate = useNavigate();

    const {user, doLogout} = useAuth();

    /**
     * The header is only visible to authenticated users.
     */
    if (!user) {
        return null;
    }

    /**
     * Terminate the current session and return
     * to the home page.
     */
    const handleLogout = async () => {

        await doLogout();
        navigate("/");

    };

    return (
        <div className="container mt-3 d-flex justify-content-end align-items-center">

            <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => navigate("/ranking")}
            >
                Ranking
            </button>

            <span className="me-3">
                Logged in as{" "}
                <strong>{user.username}</strong>
            </span>

            <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleLogout}
            >
                Logout
            </button>

        </div>
    );

}

export default Header;