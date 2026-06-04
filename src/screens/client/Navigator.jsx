import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Font from 'expo-font';
import { ActivityIndicator, StyleSheet, View, I18nManager } from 'react-native';
import Home from './screens/Home';
import Profile from './screens/Profile';
import Search from './screens/Search';
import Grocery from './screens/Grocery';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import AddCarScreen from './screens/Grocery';
import PartRequestScreen from './screens/Search';

const Tab = createBottomTabNavigator();

const Navigator = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const { t } = useTranslation();
    const { colors } = useTheme();
    const styles = createStyles(colors);
    useEffect(() => {
        (async () => {
            await Font.loadAsync({ ...Ionicons.font, ...MaterialCommunityIcons.font });
            setFontsLoaded(true);
        })();
    }, []);
const FabIcon = React.memo(function FabIcon() {
  return (
    <View style={styles.fabContainer}>
      <View style={styles.fab}>
        <Ionicons name="add" size={33} color="#FFF" />
      </View>
    </View>
  );
});
    if (!fontsLoaded) {
        return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={{ flex: 1, direction: 'ltr' }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        borderTopWidth: 1,
                        paddingTop: 0,
                        paddingBottom:0,
                        height: '12%',
                        backgroundColor: colors.background,
                        borderTopColor: colors.border,
                    },
                    tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
                    tabBarIconStyle: { marginBottom: 1 },
                }}
            >
                <Tab.Screen 
                    name={t("Home")} component={Home}
                    options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={size} /> }}
                />
                <Tab.Screen
                        name="AddCar"
                        component={AddCarScreen}
                        options={{
                          tabBarLabel: '',
                          tabBarIcon: () => <FabIcon />,
                        }}
                      />
                      <Tab.Screen
                        name="PartRequest"
                        component={PartRequestScreen}
                        options={{
                          tabBarLabel: 'سوق لاكاس',
                          tabBarIcon: ({ focused, color }) => (
                            <Ionicons name={focused ? 'cog' : 'cog-outline'} size={31} color={color} />
                          ),
                        }}
                      />
            </Tab.Navigator>
        </View>
    );
};

export default Navigator;

const createStyles = (colors) => StyleSheet.create({ 
    cartIconContainer: {
        position: 'absolute',
        top: -25,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4.65,
        elevation: 3,
    },
      fabContainer: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: "#1E4E8C",
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     'rgba(255, 255, 255, 0.45)',
  },
  fab: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: "#1E4E8C",
    justifyContent:  'center',
    alignItems:      'center',
  },
});