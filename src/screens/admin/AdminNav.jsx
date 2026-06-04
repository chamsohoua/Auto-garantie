import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import AdminDashboard from './Admindashboard'
import Adminlistingdetail from './Adminlistingdetail'
import Adminstats from './Adminstats'

const Tab = createBottomTabNavigator();

const AdminNav = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'Adminstats') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: '12%',
          paddingBottom: 25,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Adminstats" 
        component={Adminstats}
        options={{ tabBarLabel: 'Statistics' }}
      />
            <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboard}
        options={{ tabBarLabel: 'Dashboard' }}
      />
    </Tab.Navigator>
  );
};

export default AdminNav;