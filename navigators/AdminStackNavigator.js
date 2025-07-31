// navigators/AdminStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminPanel from '../screens/AdminPanel'; // 📋 Booking Dashboard
import AdminServices from '../screens/AdminServices'; // 🛠 Services
import AdminSubServices from '../screens/AdminSubServices'; // 🧩 Sub-Services
import AdminEngineers from '../screens/AdminEngineers'; // 👷 Engineers

const Stack = createNativeStackNavigator();

const AdminStackNavigator = ({ onLogout }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Booking Dashboard">
        {(props) => <AdminPanel {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Manage Services" component={AdminServices} />
      <Stack.Screen name="Manage Sub-Services" component={AdminSubServices} />
      <Stack.Screen name="Manage Engineers" component={AdminEngineers} />
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;
