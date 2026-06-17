/**
 * Main Application Component
 *
 * Defines all client-side routes of the application.
 * Protected pages are wrapped by ProtectedRoute and
 * can only be accessed by authenticated users.
 */

import { Navigate, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import ExecutionPage from "./pages/ExecutionPage";
import InstructionsPage from "./pages/InstructionsPage";
import LoginPage from "./pages/LoginPage";
import PlanningPage from "./pages/PlanningPage";
import RankingPage from "./pages/RankingPage";
import ResultPage from "./pages/ResultPage";
import SetupPage from "./pages/SetupPage";

function App() {

    return (
        <>
            <Header />

            <Routes>

                {/* Public routes. */}
                <Route
                    path="/"
                    element={<InstructionsPage />}
                />

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                {/* Routes available only to authenticated users. */}
                <Route
                    path="/setup"
                    element={
                        <ProtectedRoute>
                            <SetupPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/planning"
                    element={
                        <ProtectedRoute>
                            <PlanningPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/execution"
                    element={
                        <ProtectedRoute>
                            <ExecutionPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/result"
                    element={
                        <ProtectedRoute>
                            <ResultPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/ranking"
                    element={
                        <ProtectedRoute>
                            <RankingPage />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback route for unknown URLs. */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </>
    );

}

export default App;