// CustomerLogin.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { get, ref, set } from 'firebase/database'; // ✅
import { db } from '../firebase';

const CustomerLogin = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const userRef = ref(db, `users/${phone}`);
      const snapshot = await get(userRef);

      let role, userName;

      if (snapshot.exists()) {
        const userData = snapshot.val();
        role = userData.role || 'customer';
        userName = userData.name || 'User';
      } else {
        // ✅ Role assignment based on phone
        if (phone === '8851543700') {
          role = 'admin';
          userName = 'Admin';
        } else if (phone === '9142121672') {
          role = 'engineer';
          userName = 'Engineer';
        } else {
          role = 'customer';
          userName = 'New Customer';
        }

        // ✅ Auto-register user
        await set(userRef, {
          name: userName,
          role: role,
          createdAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('phone', phone);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('userName', userName);

      onLogin?.(role);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Something went wrong during login.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Login with Mobile</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit Mobile Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CustomerLogin;

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1A73E8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    backgroundColor: '#1A73E8',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
