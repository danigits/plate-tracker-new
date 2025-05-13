import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

export default function AddRecipeForm({ chefId, onRecipeAdded }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([{ instruction: '', duration_sec: 0, delay_sec: 0 }]);
  const [error, setError] = useState('');

  const addStep = () => {
    setSteps([...steps, { instruction: '', duration_sec: 0, delay_sec: 0 }]);
  };

  const handleStepChange = (i, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[i][field] = value;
    setSteps(updatedSteps);
  };

  const saveRecipe = async () => {
    if (!name.trim() || !description.trim() || steps.some(s => !s.instruction || s.duration_sec <= 0)) {
      setError('Please fill out all fields correctly.');
      return;
    }

    setError('');
    const recipeId = uuidv4();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('User authentication failed.');
      return;
    }

    const { error: insertError } = await supabase.from('recipes').insert([
      {
        id: recipeId,
        name,
        description,
        created_by: chefId || user.id, // fallback to auth user
      },
    ]);

    if (insertError) {
      alert('Failed to save recipe: ' + insertError.message);
      return;
    }

    const stepRecords = steps.map((step, i) => ({
      ...step,
      recipe_id: recipeId,
      step_number: i + 1,
    }));

    const { error: stepsError } = await supabase.from('recipe_steps').insert(stepRecords);

    if (stepsError) {
      alert('Failed to save steps: ' + stepsError.message);
      return;
    }

    alert('Recipe saved!');
    onRecipeAdded?.({ id: recipeId, name, steps: stepRecords });
  };

  return (
    <div className="space-y-4 p-4">
      <input
        placeholder="Recipe Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {steps.map((step, i) => (
        <div key={i} className="border p-2 rounded">
          <input
            placeholder="Instruction"
            value={step.instruction}
            onChange={(e) => handleStepChange(i, 'instruction', e.target.value)}
          />
          <input
            type="number"
            placeholder="Delay (sec)"
            value={step.delay_sec}
            onChange={(e) => handleStepChange(i, 'delay_sec', parseInt(e.target.value))}
          />
          <input
            type="number"
            placeholder="Duration (sec)"
            value={step.duration_sec}
            onChange={(e) => handleStepChange(i, 'duration_sec', parseInt(e.target.value))}
          />
        </div>
      ))}

      <Button onClick={addStep}>Add Step</Button>
      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={saveRecipe}>Save Recipe</Button>
    </div>
  );
}
