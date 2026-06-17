/**
 * Login Page
 *
 * Allows registered users to authenticate and
 * access the protected areas of the application.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function LoginPage() {

    const navigate = useNavigate();
    const { doLogin } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    /**
     * Authenticate the user and redirect
     * to the Setup phase on success.
     */
    const handleSubmit = async (event) => {

        event.preventDefault();
        setError("");

        if (!username.trim() || !password) {
            setError("Username and password are required");
            return;
        }

        try {

            await doLogin({
                username: username.trim(),
                password
            });

            navigate("/setup");

        }
        catch {

            setError("Invalid username or password");

        }

    };

    return (
        <div className="container mt-5">

            <h1>Last Race</h1>

            <form
                className="mt-4"
                onSubmit={handleSubmit}
            >

                <div className="mb-3">

                    <label className="form-label">
                        Username
                    </label>

                    <input
                        className="form-control"
                        autoComplete="username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                    />

                </div>

                <div className="mb-3">

                    <label className="form-label">
                        Password
                    </label>

                    <input
                        type="password"
                        className="form-control"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                </div>

                {error && (
                    <p className="text-danger">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                >
                    Login
                </button>

            </form>

        </div>
    );

}

export default LoginPage;