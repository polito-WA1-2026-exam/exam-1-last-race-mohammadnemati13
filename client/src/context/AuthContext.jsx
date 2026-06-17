/**
 * Authentication Context
 *
 * Provides authentication state and helper functions
 * to all React components through the Context API.
 */

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    getCurrentUser,
    login as apiLogin,
    logout as apiLogout
} from "../API";

const AuthContext = createContext(null);

function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Restore the authenticated session when the
     * application is loaded or refreshed.
     */
    useEffect(() => {

        const checkSession = async () => {

            try {

                const currentUser = await getCurrentUser();
                setUser(currentUser);

            }
            catch {

                setUser(null);

            }
            finally {

                setLoading(false);

            }

        };

        checkSession();

    }, []);

    /**
     * Authenticate a user and update the global
     * authentication state.
     *
     * @param {{username: string, password: string}} credentials
     * @returns {Promise<Object>}
     */
    const doLogin = async (credentials) => {

        const loggedUser = await apiLogin(credentials);

        setUser(loggedUser);

        return loggedUser;

    };

    /**
     * Terminate the current session and clear
     * authentication information.
     */
    const doLogout = async () => {

        await apiLogout();
        setUser(null);

    };

    const value = useMemo(
        () => ({
            user,
            loading,
            doLogin,
            doLogout
        }),
        [user, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

}

/**
 * Custom hook used to access the authentication context.
 *
 * @returns {Object}
 */
function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }

    return context;

}

export {
    AuthProvider,
    useAuth
};