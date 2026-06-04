import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Logo from "../assets/icon2.png";
import { supabase } from "./supabase"; 
import { useDispatch } from "react-redux";
import { loginUser } from "./redux/slices/authSlice";
import colors from "./colors";

export default function Login({ navigation }) {
  const dispatch = useDispatch();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [userData, setUserData] = useState(null);

  const otpInputRef = useRef(null);

  const PHONE_MAX_LENGTH = 10; 
  const OTP_MAX_LENGTH = 4; 

  useEffect(() => {
    const checkStoredLogin = async () => {
      try {
        const userId = await SecureStore.getItemAsync("userId");
        const role = await SecureStore.getItemAsync("userRole");

        if (userId && role) {
          setLoading(true);
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", isNaN(userId) ? userId : parseInt(userId))
            .maybeSingle();
          
          if (!error && user) {
            dispatch(loginUser({
              id: user.id,
              name: user.full_name,
              role: user.role,
              phone: user.phone,
              avatar: user.avatar_url,
              createdAt: user.created_at,
            }));

            const routes = {
              admin: "AdminNav",
              seller: "SuperNav",
              regular_user: "Navigator",
              client: "Navigator",
            };
            const target = routes[user.role] ?? "Navigator";
            navigation.replace(target, { userId: user.id, userRole: user.role });
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error restoring login:", err);
        setLoading(false);
      }
    };

    checkStoredLogin();
  }, []);

  const getFormattedPhone = () => {
    const cleanPhone = phone.trim().startsWith('0')
      ? phone.trim().substring(1)
      : phone.trim();
    return `+213${cleanPhone}`;
  };

  const handlePhoneSubmit = async () => {
    if (phone.length < 9) {
      Alert.alert("خطأ", "يرجى إدخال رقم هاتف صحيح مكون من 9 أرقام على الأقل");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = getFormattedPhone();
      
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", fullPhone)
        .maybeSingle();

      if (error) throw error;

      if (user) {
        setIsNewUser(false);
        setUserData(user);
      } else {
        setIsNewUser(true);
        setUserData(null);
      }

      setStep(2);
    } catch (err) {
      console.error(err);
      Alert.alert("خطأ", "مشكلة في الاتصال بقاعدة البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = () => {
    if (otp.length !== OTP_MAX_LENGTH) {
      Alert.alert("خطأ", "يرجى إدخال كود التحقق كاملاً");
      return;
    }

    if (otp !== "1234") {
      Alert.alert("خطأ", "كود التحقق غير صحيح (استخدم 1234)");
      return;
    }

    if (isNewUser) {
      setStep(3);
    } else {
      completeLogin(userData);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال الاسم الكامل");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = getFormattedPhone();

      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            full_name: fullName.trim(),
            phone: fullPhone,
            role: "regular_user", 
          },
        ])
        .select()
        .single();

      if (error) throw error;

      completeLogin(newUser);
    } catch (err) {
      console.error(err);
      Alert.alert("خطأ", "فشل إنشاء الحساب، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (user) => {
    try {
      dispatch(loginUser({
        id: user.id,
        name: user.full_name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar_url,
        createdAt: user.created_at,
      }));

      await SecureStore.setItemAsync("userId", String(user.id));
      await SecureStore.setItemAsync("userRole", user.role);
      await SecureStore.setItemAsync("userName", user.full_name ?? "");
      await SecureStore.setItemAsync("userPhone", user.phone);

      const routes = {
        admin: "AdminNav",
        seller: "SuperNav",
        regular_user: "Navigator",
        client: "Navigator",
      };
      
      const target = routes[user.role] ?? "Navigator";
      navigation.replace(target, { userId: user.id, userRole: user.role });
    } catch (err) {
      console.error(err);
      Alert.alert("خطأ", "فشل حفظ بيانات تسجيل الدخول المحلية");
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < OTP_MAX_LENGTH; i++) {
      const digit = otp[i] || "";
      boxes.push(
        <View key={i} style={[styles.box, styles.otpBox]}>
          <Text style={styles.boxText}>{digit}</Text>
        </View>
      );
    }
    return <View style={styles.boxesContainer}>{boxes}</View>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E4E8C" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            isLandscape ? styles.Landcontainer : styles.container,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.blueBanner} />

          <Image 
            source={Logo} 
            style={[
              styles.logo2, 
              isLandscape ? styles.logoLandscape : styles.logoPortrait
            ]} 
          />

          {step === 1 && (
            <View style={styles.stepWrapper}>
              <Text style={styles.titleText}>أدخل رقم الهاتف</Text>
              <Text style={styles.subText}>سيتم التحقق من رقمك فوراً</Text>
              
              <TextInput
                 style={styles.normalInput}
                 placeholder="07XX XX XX XX"
                 placeholderTextColor="#9e9e9e"
                 value={phone.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4").trim()}
                 onChangeText={(text) => {
                 const cleaned = text.replace(/\s+/g, "");
                  if (cleaned.length <= PHONE_MAX_LENGTH) {
                    setPhone(cleaned);
                  }
                 }}
                 keyboardType="number-pad"
                 maxLength={13} 
                 autoFocus={true}
                 textAlign="center"
                />

              <TouchableOpacity style={styles.button} onPress={handlePhoneSubmit}>
                <Text style={styles.buttonText}>التالي</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepWrapper}>
              <Text style={styles.titleText}>رمز التحقق (OTP)</Text>
              <Text style={styles.subText}>أدخل الرمز لتأكيد هويتك </Text>
              <Text style={{ fontSize: 16, color: "red", textAlign: "center", marginTop:-20, marginBottom: 22,}}>(استخدم 1234)</Text>
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={() => otpInputRef.current?.focus()}
                style={styles.inputTargetArea}
              >
                {renderOtpBoxes()}
              </TouchableOpacity>

              <TextInput
                ref={otpInputRef}
                style={styles.hiddenInput}
                value={otp}
                onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={OTP_MAX_LENGTH}
                autoFocus={true}
              />

              <TouchableOpacity style={styles.button} onPress={handleOtpSubmit}>
                <Text style={styles.buttonText}>تأكيد الرمز</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>تعديل رقم الهاتف</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepWrapper}>
              <Text style={styles.titleText}>مرحباً بك معنا!</Text>
              <Text style={styles.subText}>يبدو أنك مستخدم جديد، يرجى كتابة اسمك الكامل لإتمام الحساب</Text>
              
              <TextInput
                style={styles.normalInput}
                placeholder="الاسم الكامل"
                placeholderTextColor="#4d4d4dff"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                color='#000'
              />

              <TouchableOpacity style={styles.button} onPress={handleRegisterSubmit}>
                <Text style={styles.buttonText}>دخول التطبيق</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E4E8C",
  },
  blueBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 265,
    backgroundColor: "#1E4E8C",
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    zIndex: -1,
  },
  logo2: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    marginTop: 40,
    marginBottom: 10,
  },
  logoPortrait: {
    width: "65%",
    height: 200,
  },
  logoLandscape: {
    width: "100%",
    height: "35%",
  },
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: "5%",
    paddingBottom: "20%",
    backgroundColor: '#fff'
  },
  Landcontainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: "0%",
    paddingBottom: 40,
  },
  stepWrapper: {
    width: "100%",
    alignItems: "center",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E4E8C",
    marginBottom: 5,
    textAlign: "center",
  },
  subText: {
    fontSize: 18,
    color: "gray",
    marginBottom: 25,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  inputTargetArea: {
    width: "90%",
    marginVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenInput: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },
  boxesContainer: {
    flexDirection: "row-reverse", 
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  box: {
    width: 32,
    height: 45,
    borderWidth: 1.5,
    borderColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
    backgroundColor: colors.light || "#f9f9f9",
  },
  otpBox: {
    width: 50,
    height: 55,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  boxText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  normalInput: {
    width: "80%",
    borderWidth: 1,
    padding: 15,
    marginBottom: 25,
    borderRadius: 15,
    fontSize: 21,
    color: "#000",
    borderColor: "#1E4E8C",
    textAlign: "center",
    backgroundColor: colors.light || "#f9f9f9",
  },
  button: {
    backgroundColor: "#1E4E8C",
    padding: 15,
    borderRadius: 20,
    width: "60%",
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: "#1A5BAA",
    fontSize: 16,
    fontWeight: "600",
  },
});