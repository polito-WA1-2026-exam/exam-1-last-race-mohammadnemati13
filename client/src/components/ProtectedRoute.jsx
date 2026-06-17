/**
 * Protected Route
 *
 * Restricts access to authenticated users.
 * Unauthenticated visitors are redirected
 * to the login page.
 */

import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    // Wait until session restoration completes.
    if (loading)
        return null;

    // Redirect anonymous users.
    if (!user)
        return (
            <Navigate
                to="/login"
                replace
            />
        );

    return children;
}

export default ProtectedRoute;