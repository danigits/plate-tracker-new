import { useEffect, useState } from 'react';
import RecipeForm from '@/components/dashboard/AddRecipeForm'; // Adjust path as needed
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function RecipePage() {
  const [showForm, setShowForm] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserAndRecipes = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;
      setUserId(user.user.id);

      const { data, error } = await supabase
        .from('recipes')
        .select(`*, recipe_steps(*)`)
        .eq('created_by', user.user.id)
        .order('created_at', { ascending: false });

      if (!error) setRecipes(data);
    };

    fetchUserAndRecipes();
  }, []);
  const handleRecipeAdded = (newRecipe) => {
    // Optionally: refetch or update recipe list
    setShowForm(false);
  };
  const startCooking = (recipe) => {
    navigate('/cook', { state: { recipe } });
  };
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          ➕ Add Recipe
        </button>
      </div>

      {/* List of Recipes */}
      {recipes.map((recipe) => (
        <div key={recipe.id} className="border rounded p-4 mb-4 shadow-sm">
          
          <h2 className="text-xl font-semibold">{recipe.name}</h2>
          <p className="text-gray-600">{recipe.description}</p>
          <button
  className="mt-3 px-4 py-2 bg-green-600 text-white rounded"
  onClick={() => startCooking(recipe)}
>
  🍳 Start Cooking
</button>
          <h3 className="mt-3 font-bold">Steps:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            {recipe.recipe_steps
              .sort((a, b) => a.step_number - b.step_number)
              .map((step) => (
                <li key={step.id}>
                  <div className="font-medium">{step.instruction}</div>
                  <div className="text-sm text-gray-500">
                    Delay: {step.delay_sec}s, Duration: {step.duration_sec}s
                  </div>
                </li>
              ))}
          </ol>
          

        </div>
      ))}

      {showForm && (
        <RecipeForm
          onClose={() => setShowForm(false)}
          onRecipeAdded={handleRecipeAdded}
        />
      )}
    </div>
  );
}
