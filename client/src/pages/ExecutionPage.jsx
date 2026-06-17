/**
 * Execution Page
 *
 * Displays the execution of the selected route one
 * segment at a time. For each segment, the associated
 * random event and score update are shown to the player.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ExecutionPage() {

    const location = useLocation();
    const navigate = useNavigate();

    // Data produced by the server after route validation.
    const steps = location.state?.steps ?? [];
    const finalScore = location.state?.finalScore ?? 0;

    const [currentStep, setCurrentStep] = useState(0);

    if (steps.length === 0) {
        return (
            <div className="container mt-5">

                <h1>Execution Phase</h1>

                <p>
                    No execution data available.
                </p>

            </div>
        );
    }

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    /**
     * Advance to the next execution step.
     *
     * When the final step is reached, the player
     * is redirected to the Result page.
     */
    const handleNext = () => {

        if (isLastStep) {

            navigate("/result", {
                state: {
                    score: finalScore,
                    success: true
                }
            });

            return;
        }

        setCurrentStep((current) => current + 1);

    };

    return (
        <div className="container mt-5">

            <h1>
                Execution Phase
            </h1>

            <h4>
                Step {currentStep + 1} / {steps.length}
            </h4>

            <hr />

            <h5>
                Segment
            </h5>

            <p>
                {step.station1Name}
                {" → "}
                {step.station2Name}
            </p>

            <hr />

            <h5>
                Event
            </h5>

            <p>
                {step.eventDescription}
            </p>

            <p>
                Effect: {step.eventEffect}
            </p>

            <p>
                Coins: {step.scoreAfterStep}
            </p>

            <button
                className="btn btn-primary"
                onClick={handleNext}
            >
                {isLastStep ? "Finish" : "Next"}
            </button>

        </div>
    );

}

export default ExecutionPage;