// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomerLogin from './screens/CustomerLogin';
import BookingForm from './screens/BookingForm';
import MainTabs from './MainTabs';
import EngineerDashboard from './screens/EngineerDashboard';
import AdminEngineers from './screens/AdminEngineers';
import AdminServices from './screens/AdminServices';
import AdminSubServices from './screens/AdminSubServices';
import AdminViewOrders from './screens/AdminViewOrders';

import { ThemeProvider } from './context/ThemeContext';
import { navigationRef } from './navigationRef';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('CustomerLogin');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const loginStatus = await AsyncStorage.getItem('isLoggedIn');
        const storedPhone = await AsyncStorage.getItem('phone');
        const storedRole = await AsyncStorage.getItem('role');

        if (loginStatus === 'true') {
          setInitialRoute('MainTabs');
        } else {
          setInitialRoute('CustomerLogin');
        }

        setUserPhone(storedPhone || '');
        setUserRole(storedRole || '');
        setIsReady(true);
      } catch (err) {
        console.error('Error restoring session:', err);
        setInitialRoute('CustomerLogin');
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      const phone = await AsyncStorage.getItem('phone');
      const role = await AsyncStorage.getItem('role');

      setUserPhone(phone || '');
      setUserRole(role || '');

      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err) {
      console.error('Login Error:', err);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['isLoggedIn', 'phone', 'role']);
    setUserPhone('');
    setUserRole('');

    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: 'CustomerLogin' }],
    });
  };

  if (!isReady) return null;

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="CustomerLogin">
            {(props) => <CustomerLogin {...props} onLogin={handleLogin} />}
          </RootStack.Screen>

          <RootStack.Screen name="MainTabs">
            {(props) => (
              <MainTabs
                {...props}
                onLogout={handleLogout}
                userPhone={userPhone}
                userRole={userRole}
              />
            )}
          </RootStack.Screen>

          <RootStack.Screen name="BookingForm" component={BookingForm} />
          <RootStack.Screen name="EngineerDashboard" component={EngineerDashboard} />
          <RootStack.Screen name="AdminEngineers" component={AdminEngineers} />
          <RootStack.Screen name="AdminServices" component={AdminServices} />
          <RootStack.Screen name="AdminSubServices" component={AdminSubServices} />
          <RootStack.Screen name="AdminViewOrders" component={AdminViewOrders} />
        </RootStack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
