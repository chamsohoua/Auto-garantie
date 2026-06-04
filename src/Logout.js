import * as SecureStore from "expo-secure-store";

export async function logout(navigation) {
  await SecureStore.deleteItemAsync("userId");
  await SecureStore.deleteItemAsync("userRole");
  navigation.replace("Login");
}
