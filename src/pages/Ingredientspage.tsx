// src/pages/ingredients.tsx
import React from "react";
import IngredientManager from "./IngredientManager";
import { Card } from "@/components/ui/card";

const IngredientsPage: React.FC = () => {
  return (
    <Card className="p-6">
      <IngredientManager />
    </Card>
  );
};

export default IngredientsPage;
