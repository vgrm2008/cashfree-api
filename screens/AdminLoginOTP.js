import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet
} from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth } from '../firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigationRef';

const AdminLoginOTP = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState('');
  const recaptchaVerifier = React.useRef(null);

  const sendOTP = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        `+91${phone}`,
        recaptchaVerifier.current
      );
      setVerificationId(id);
      Alert.alert('OTP Sent', 'Check your phone for the OTP.');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  const confirmCode = async () => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);

      await AsyncStorage.setItem('isAdmin', 'true');
      onLogin?.(); // Update state
      navigationRef.navigate('Admin'); // Auto-redirect
    } catch (err) {
      Alert.alert('Login Failed', 'Invalid OTP or verification error');
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />
      <Text style={styles.title}>Admin Login via OTP</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Mobile Number"
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={setPhone}
      />

      <TouchableOpacity style={styles.button} onPress={sendOTP}>
        <Text style={styles.btnText}>Send OTP</Text>
      </TouchableOpacity>

      {verificationId && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            onChangeText={setCode}
            maxLength={6}
          />

          <TouchableOpacity style={styles.button} onPress={confirmCode}>
            <Text style={styles.btnText}>Verify & Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default AdminLoginOTP;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 12,
    marginVertical: 8, borderRadius: 10
  },
  button: {
    backgroundColor: '#1A73E8',
    padding: 14, borderRadius: 10, alignItems: 'center', marginVertical: 10
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
