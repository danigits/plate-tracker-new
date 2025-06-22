// DashboardAndFeedbackScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DashboardAndFeedbackScreen = () => {
  const [deliveryPointId, setDeliveryPointId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = await AsyncStorage.getItem("deliveryPointUser");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      setDeliveryPointId(parsedUser.delivery_point_id);

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("delivery_point_plan_items")
        .select("*, menu_items(name)")
        .eq("delivery_point_id", parsedUser.delivery_point_id)
        .eq("date", today);

      if (error) console.error(error);
      else setPlans(data);
    };
    fetchData();
  }, []);

  const handleChange = (id, field, value) => {
    setFeedback((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const submitFeedback = async (itemId) => {
    const data = feedback[itemId];
    if (!data) return;

    const payload = {
      delivery_point_plan_item_id: itemId,
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("delivery_point_feedback")
      .upsert(payload);

    if (error) console.error("Submit error", error);
    else alert("Feedback submitted!");
  };

  const renderItem = ({ item }) => (
    <View style={{ padding: 16, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: "bold" }}>{item.menu_items.name}</Text>
      <TextInput
        placeholder="Consumed Qty"
        keyboardType="numeric"
        onChangeText={(text) => handleChange(item.id, "consumed_qty", text)}
      />
      <TextInput
        placeholder="Wastage Qty"
        keyboardType="numeric"
        onChangeText={(text) => handleChange(item.id, "wastage_qty", text)}
      />
      <TextInput
        placeholder="Average Qty"
        keyboardType="numeric"
        onChangeText={(text) => handleChange(item.id, "avg_qty", text)}
      />
      <TextInput
        placeholder="Arrival Time (HH:MM)"
        onChangeText={(text) => handleChange(item.id, "arrival_time", text)}
      />
      <TextInput
        placeholder="Feedback"
        onChangeText={(text) => handleChange(item.id, "feedback", text)}
      />
      <Button title="Submit" onPress={() => submitFeedback(item.id)} />
    </View>
  );

  return (
    <FlatList
      data={plans}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

export default DashboardAndFeedbackScreen;
