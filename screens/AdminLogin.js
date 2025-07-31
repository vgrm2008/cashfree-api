import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../navigationRef'; // ✅ Import global navigate

export default function AdminLogin({ onLogin }) {
  const [pin, setPin] = useState('');

  const handleLogin = async () => {
    if (pin === '1234') {
      try {
        await AsyncStorage.setItem('isAdmin', 'true');
        onLogin(); // updates state in App.js
        navigate('Admin'); // ✅ redirect to Admin tab
      } catch (e) {
        Alert.alert('Error', 'Could not save admin status.');
      }
    } else {
      Alert.alert('Invalid PIN', 'Please enter the correct admin PIN.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>🔐 Admin Login</Text>

      <TextInput
        value={pin}
        onChangeText={setPin}
        placeholder="Enter Admin PIN"
        keyboardType="numeric"
        maxLength={6}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Unlock Admin</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1A237E',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1A73E8',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
