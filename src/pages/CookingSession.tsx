// src/pages/CookingSession.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CookingSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = location.state?.recipe;

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<'delay' | 'duration'>('delay');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!recipe) {
      navigate('/recipe');
      return;
    }

    const currentStep = recipe.recipe_steps[stepIndex];
    setTimeLeft(phase === 'delay' ? currentStep.delay_sec : currentStep.duration_sec);
  }, [stepIndex, phase]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (phase === 'delay') {
        setPhase('duration');
      } else {
        if (stepIndex < recipe.recipe_steps.length - 1) {
          setStepIndex(stepIndex + 1);
          setPhase('delay');
        } else {
          alert('🎉 Recipe Completed!');
          navigate('/recipes');
        }
      }
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, phase]);

  if (!recipe) return null;

  const currentStep = recipe.recipe_steps[stepIndex];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{recipe.name}</h1>
      <div className="border rounded p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-2">
          Step {stepIndex + 1}: {currentStep.instruction}
        </h2>
        <p className="text-gray-600 mb-4">
          {phase === 'delay' ? 'Get Ready:' : 'Do it now:'}
        </p>
        <div className="text-5xl font-bold text-center text-orange-600">{timeLeft}s</div>
      </div>
    </div>
  );
}
