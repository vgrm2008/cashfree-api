import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import MyBookings from './screens/MyBookings';
import ServiceStackNavigator from './navigators/ServiceStackNavigator';
import ProfileScreen from './screens/ProfileScreen';
import AdminStackNavigator from './navigators/AdminStackNavigator';
import EngineerDashboard from './screens/EngineerDashboard';

const Tab = createBottomTabNavigator();

const MainTabs = ({ onLogout, userPhone, userRole }) => {
  const iconMap = {
    Home: 'home-outline',
    'Book Service': 'construct-outline',
    'My Bookings': 'clipboard-outline',
    Profile: 'person-circle-outline',
    Admin: 'shield-checkmark-outline',
    EngineerDashboard: 'briefcase-outline',
  };

  const isAdminUser = userRole === 'admin' && ['8851543700', '9999999999'].includes(userPhone);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: `Welcome, ${userPhone || 'User'}`,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconMap[route.name] || 'ellipse-outline'} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#1A73E8',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {/* ✅ Engineer only view */}
      {userRole === 'engineer' ? (
        <Tab.Screen
          name="EngineerDashboard"
          children={(props) => <EngineerDashboard {...props} onLogout={onLogout} userPhone={userPhone} />}
          options={{ tabBarLabel: 'Dashboard' }}
        />
      ) : (
        <>
          <Tab.Screen name="Home">
            {() => <HomeScreen onLogout={onLogout} userPhone={userPhone} />}
          </Tab.Screen>
          <Tab.Screen name="Book Service" component={ServiceStackNavigator} />
          <Tab.Screen name="My Bookings" component={MyBookings} />
          <Tab.Screen name="Profile" component={ProfileScreen} />

          {/* ✅ Admin tab shown ONLY for approved phone numbers */}
          {isAdminUser && (
            <Tab.Screen name="Admin">
              {(props) => <AdminStackNavigator {...props} onLogout={onLogout} />}
            </Tab.Screen>
          )}
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabs;
