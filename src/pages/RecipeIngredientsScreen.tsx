import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/integrations/supabase/client";

const RecipeIngredientsScreen = ({ menuItemId }: { menuItemId: string }) => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "",
    per_serving_qty: "",
    required_qty: "",
    final_used_qty: "",
  });

  useEffect(() => {
    if (menuItemId) fetchIngredients();
  }, [menuItemId]);

  const fetchIngredients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_item_ingredients")
      .select(
        `
        id,
        per_serving_qty,
        required_qty,
        final_used_qty,
        ingredients (
          name,
          unit
        )
      `
      )
      .eq("menu_item_id", menuItemId);

    if (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load ingredients");
    } else {
      setIngredients(data);
    }
    setLoading(false);
  };

  const addIngredient = async () => {
    const { name, unit, per_serving_qty, required_qty, final_used_qty } =
      newIngredient;
    if (
      !name ||
      !unit ||
      !per_serving_qty ||
      !required_qty ||
      !final_used_qty
    ) {
      Alert.alert("Missing Data", "Please fill all fields");
      return;
    }

    let { data: ingredient, error } = await supabase
      .from("ingredients")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (!ingredient && !error) {
      const { data: newIng, error: insertErr } = await supabase
        .from("ingredients")
        .insert({ name: name.trim(), unit: unit.trim() })
        .select()
        .single();
      if (insertErr) {
        Alert.alert("Error", "Failed to create ingredient");
        return;
      }
      ingredient = newIng;
    }

    const { error: insertIngredientError } = await supabase
      .from("menu_item_ingredients")
      .insert({
        menu_item_id: menuItemId,
        ingredient_id: ingredient.id,
        per_serving_qty: parseFloat(per_serving_qty),
        required_qty: parseFloat(required_qty),
        final_used_qty: parseFloat(final_used_qty),
      });

    if (insertIngredientError) {
      console.error(insertIngredientError);
      Alert.alert("Error", "Failed to add ingredient to recipe");
    } else {
      setNewIngredient({
        name: "",
        unit: "",
        per_serving_qty: "",
        required_qty: "",
        final_used_qty: "",
      });
      fetchIngredients();
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
        Ingredients for Menu Item
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={ingredients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={{ marginBottom: 5 }}>
              {item.ingredients.name} ({item.ingredients.unit}):{" "}
              {item.final_used_qty}
            </Text>
          )}
        />
      )}

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>Add Ingredient</Text>

      <TextInput
        placeholder="Ingredient Name"
        value={newIngredient.name}
        onChangeText={(text) =>
          setNewIngredient({ ...newIngredient, name: text })
        }
        style={{ borderBottomWidth: 1, marginVertical: 5 }}
      />
      <TextInput
        placeholder="Unit (e.g., KG)"
        value={newIngredient.unit}
        onChangeText={(text) =>
          setNewIngredient({ ...newIngredient, unit: text })
        }
        style={{ borderBottomWidth: 1, marginVertical: 5 }}
      />
      <TextInput
        placeholder="Per Serving Qty"
        keyboardType="numeric"
        value={newIngredient.per_serving_qty}
        onChangeText={(text) =>
          setNewIngredient({ ...newIngredient, per_serving_qty: text })
        }
        style={{ borderBottomWidth: 1, marginVertical: 5 }}
      />
      <TextInput
        placeholder="Required Qty"
        keyboardType="numeric"
        value={newIngredient.required_qty}
        onChangeText={(text) =>
          setNewIngredient({ ...newIngredient, required_qty: text })
        }
        style={{ borderBottomWidth: 1, marginVertical: 5 }}
      />
      <TextInput
        placeholder="Final Used Qty"
        keyboardType="numeric"
        value={newIngredient.final_used_qty}
        onChangeText={(text) =>
          setNewIngredient({ ...newIngredient, final_used_qty: text })
        }
        style={{ borderBottomWidth: 1, marginVertical: 5 }}
      />

      <Button title="Add Ingredient" onPress={addIngredient} />
    </View>
  );
};

export default RecipeIngredientsScreen;
