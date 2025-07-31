import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { push, ref } from 'firebase/database';

const BACKEND_URL = 'https://your-vercel-api-url.vercel.app/api/create-payment'; // Replace this

const PaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [paymentUrl, setPaymentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBookingSaved, setIsBookingSaved] = useState(false);

  const {
    bookingData
  } = route.params;

  useEffect(() => {
    createCashfreeOrder();
  }, []);

  const createCashfreeOrder = async () => {
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: bookingData.name,
          customerPhone: bookingData.phone,
          customerEmail: 'test@example.com', // Optional or dynamic
          amount: bookingData.total,
        }),
      });

      const data = await res.json();
      if (data && data.paymentLink) {
        setPaymentUrl(data.paymentLink);
      } else {
        throw new Error('Failed to create payment link');
      }
    } catch (error) {
      Alert.alert('Error', 'Payment initialization failed: ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState) => {
    const { url } = navState;

    if (url.includes('success')) {
      if (!isBookingSaved) {
        await saveBookingToFirebase();
        setIsBookingSaved(true);
        Alert.alert('Payment Success', 'Your booking is confirmed!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'My Bookings' }],
        });
      }
    }

    if (url.includes('cancel') || url.includes('failure')) {
      Alert.alert('Payment Failed', 'Transaction was not successful.');
      navigation.goBack();
    }
  };

  const saveBookingToFirebase = async () => {
    try {
      const bookingRef = ref(db, 'bookings');
      const newBooking = {
        ...bookingData,
        status: 'Pending',
        paymentStatus: 'Paid',
        paymentTime: new Date().toISOString(),
      };
      await push(bookingRef, newBooking);
    } catch (err) {
      Alert.alert('Error', 'Booking save failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleWebViewNavigationStateChange}
      startInLoadingState
      javaScriptEnabled
      domStorageEnabled
    />
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
