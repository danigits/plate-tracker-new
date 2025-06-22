import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/integrations/supabase/client";

const LoginScreen = ({ navigation }: any) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("delivery_points")
      .select("id, auth_token")
      .eq("code", code)
      .single();

    if (error || !data) {
      Alert.alert("Login Failed", "Invalid code or delivery point not found");
      setLoading(false);
      return;
    }

    let token = data.auth_token;

    if (!token) {
      // generate and update new token
      token = crypto.randomUUID();
      await supabase
        .from("delivery_points")
        .update({ auth_token: token })
        .eq("id", data.id);
    }

    await AsyncStorage.setItem("delivery_point_token", token);
    await AsyncStorage.setItem("delivery_point_id", data.id);

    navigation.replace("Dashboard");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Delivery Point Login</Text>
      <TextInput
        placeholder="Enter Delivery Code"
        value={code}
        onChangeText={setCode}
        style={{ borderWidth: 1, marginVertical: 12, padding: 10 }}
      />
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
};

export default LoginScreen;
