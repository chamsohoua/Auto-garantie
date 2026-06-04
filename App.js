import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import { store } from "./src/redux/store"; 
import './src/screens/client/i18n';
import Login from "./src/Login";
import Home from "./src/screens/client/screens/Home";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import SignupScreen from "./src/SignUp";
import Navigator from "./src/screens/client/Navigator";
import DetailsScreen from "./src/screens/client/screens/DetailsScreen";
import Profile from "./src/screens/client/screens/Profile";
import Search from "./src/screens/client/screens/Search";
import Grocery from "./src/screens/client/screens/Grocery";
import { ThemeProvider } from "./src/context/ThemeContext";
import AdminNav from "./src/screens/admin/AdminNav";
import Settings from "./src/screens/client/screens/Settings";
import Password from "./src/screens/client/screens/Password";
import ListingScreen from "./src/screens/client/screens/ListingSuccess";
import AdminDashboard from "./src/screens/admin/Admindashboard";
import Adminstats from "./src/screens/admin/Adminstats";
import AdminListingDetail from "./src/screens/admin/Adminlistingdetail";


const Stack = createNativeStackNavigator();



export default function App() {

  return (
    <Provider store={store}>
      <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Navigator" component={Navigator} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="DetailsScreen" component={DetailsScreen} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Search" component={Search} />
          <Stack.Screen name="Grocery" component={Grocery} />
          <Stack.Screen name="AdminNav" component={AdminNav} />
          <Stack.Screen name="Adminstats" component={Adminstats} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="AdminListingDetail" component={AdminListingDetail} />
          <Stack.Screen name="Password" component={Password} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard}/>
          <Stack.Screen name="ListingSuccess" component={ListingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
}