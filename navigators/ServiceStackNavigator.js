// navigators/ServiceStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ServiceScreen from '../screens/ServiceScreen';
import SubServicesScreen from '../screens/SubServicesScreen';
import BookingForm from '../screens/BookingForm';
import ProfileScreen from '../screens/ProfileScreen';
import EngineerDashboard from '../screens/EngineerDashboard'; // ✅ Correct path

const Stack = createNativeStackNavigator();

const ServiceStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="ServiceScreen">
      <Stack.Screen
        name="ServiceScreen"
        component={ServiceScreen}
        options={{ title: 'Choose Service' }}
      />
      <Stack.Screen
        name="SubServices"
        component={SubServicesScreen}
        options={{ title: 'Select Sub Services' }}
      />
      <Stack.Screen
        name="BookingForm"
        component={BookingForm}
        options={{ title: 'Book Service' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="EngineerDashboard"
        component={EngineerDashboard}
        options={{ title: 'Engineer Dashboard' }}
      />
    </Stack.Navigator>
  );
};

export default ServiceStackNavigator;
