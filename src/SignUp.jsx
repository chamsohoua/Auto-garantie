import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";
import Logo from "../assets/Logo.png";
import colors from "./colors";

export default function SignupScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState("client");
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [correctCode, setCorrectCode] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    
    if (cleaned.startsWith("0")) {
      return "+213" + cleaned.substring(1);
    } else if (!cleaned.startsWith("213")) {
      return "+213" + cleaned;
    }
    return "+" + cleaned;
  };


  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '×':
        answer = num1 * num2;
        break;
    }
    
    return {
      question: `${num1} ${operator} ${num2} = ?`,
      answer: answer.toString()
    };
  };

 const handleSignup = async () => {
  if (
    !name ||
    !phoneNumber ||
    !password ||
    (selectedRole === "restaurant" && !restaurantName)
  ) {
    Alert.alert("Error", "Please fill in all required fields.");
    return;
  }

  if (phoneNumber.replace(/\D/g, "").length < 9) {
    Alert.alert("Error", "Please enter a valid phone number.");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Error", "Password must be at least 6 characters long.");
    return;
  }


  const captcha = generateCaptcha();
  setCorrectCode(captcha.answer);
  setCaptchaQuestion(captcha.question);
  setShowVerification(true);
};

  const handleVerification = () => {
    if (verificationCode.trim() === correctCode) {
      setShowVerification(false);
      setVerificationCode("");
      proceedWithSignup();
    } else {
      Alert.alert("Incorrect", "Wrong answer. Please try again.");
      const captcha = generateCaptcha();
      setCorrectCode(captcha.answer);
      setCaptchaQuestion(captcha.question);
      setVerificationCode("");
    }
  };

  const proceedWithSignup = async () => {
  setLoading(true);

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("phone_number", formattedPhone)
      .single();

    if (existingUser) {
      Alert.alert("Error", "This phone number is already registered.");
      setLoading(false);
      return;
    }

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      let storeId = null;
      if (selectedRole === "restaurant") {
        const { data: newStore, error: storeError } = await supabase
          .from("stores")
          .insert({
            name: restaurantName,
            description: `Welcome to ${restaurantName}`,
            rating: 0,
            review_count: 0,
            is_open: true,
          })
          .select()
          .single();

        if (storeError) {
          console.error("Store creation error:", storeError);
          Alert.alert("Error", "Failed to create restaurant. Please try again.");
          setLoading(false);
          return;
        }

        storeId = newStore.id;
        console.log("✅ Store created with ID:", storeId);
      }

      const userEntry = {
        email: formattedPhone,
        name,
        password: hashedPassword,
        role: selectedRole,
        phone_number: formattedPhone,
        created_at: new Date().toISOString(),
      };

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert(userEntry)
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", userError);
        
        if (storeId) {
          await supabase.from("stores").delete().eq("id", storeId);
        }
        
        Alert.alert("Error", "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ User created:", newUser);

      await SecureStore.setItemAsync("userEmail", newUser.email);
      await SecureStore.setItemAsync("userRole", newUser.role);
      await SecureStore.setItemAsync("userId", newUser.id.toString());
      if (storeId) {
        await SecureStore.setItemAsync("storeId", storeId.toString());
      }

      Alert.alert("Success", "Account created successfully!");

      console.log("🚀 Navigating to Navigator");
      navigation.replace("Navigator", {
        userEmail: newUser.email,
        userRole: newUser.role,
      });

    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoWrapper}>
              <Image source={Logo} style={styles.logo2} />
            </View>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={
                  selectedRole === "restaurant"
                    ? "Owner name"
                    : selectedRole === "driver"
                    ? "Driver name"
                    : "إسمك"
                }
                value={name}
                onChangeText={setName}
                placeholderTextColor="#4d4d4dff"
              />

              {selectedRole === "restaurant" && (
                <TextInput
                  style={styles.input}
                  placeholder="Restaurant name"
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholderTextColor="#4d4d4dff"
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="رقم الهاتف (مثل: 0555123456)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#4d4d4dff"
              />

              <TextInput
                style={styles.input}
                placeholder="كلمة السر"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#4d4d4dff"
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "جاري فتح الحساب..." : "تسجيل حساب"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.join}>
              لديك حساب بالفعل ؟{" "}
              <Text
                onPress={() => navigation.replace("Login")}
                style={{ color: colors.primary, fontSize: 19, fontWeight: "600" }}
              >
                سجل الدخول
              </Text>
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Modal
        visible={showVerification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVerification(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>تأكيد انك لست روبوت</Text>
                  <Text style={styles.modalSubtitle}>حل المعادلة الرياضية</Text>
                </View>

                <View style={styles.captchaBox}>
                  <Text style={styles.captchaQuestion}>
                    {captchaQuestion}
                  </Text>
                </View>

                <TextInput
                  style={styles.captchaInput}
                  placeholder="Enter answer"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  autoFocus
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowVerification(false);
                      setVerificationCode("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleVerification}
                  >
                    <Text style={styles.verifyButtonText}>تأكيد</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: "flex-start",
  },
  logoWrapper: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  logo2: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cacaca',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 12,
    backgroundColor: colors.light,
    color: "#000",
    textAlign: 'right',
    marginBottom:15,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  join: {
    textAlign: "center",
    color: colors.black,
    marginTop: 15,
    marginBottom: 30,
    fontSize:16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
   roleSelection: {
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between',
    marginBottom: 25,
    borderRadius: 15,
    backgroundColor: colors.light, 
    padding: 5,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'transparent',
    borderWidth: 0.75,
    borderColor: '#000',
  },
  roleButtonActive: {
    backgroundColor: '#1E4E8C',
    borderColor: '#ac3600ff', 
    shadowColor: '#ac3600ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  roleText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  roleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  captchaBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
  },
  captchaQuestion: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 2,
  },
  captchaInput: {
    borderWidth: 2,
    borderColor: colors.medium,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    textAlign: "center",
    backgroundColor: colors.light,
    color: "#000",
    fontWeight: "600",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  verifyButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  verifyButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
