import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function BookingSuccess({ route }) {
  const navigation = useNavigation();
  const { service } = route.params || {};

  const handleHome = () => {
    navigation.navigate('Home'); // 👈 Ensure you have 'Home' screen in your main navigator
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/success-check.gif')} // 👈 Use a check animation or success image (place in /assets)
        style={styles.image}
      />
      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your <Text style={{ fontWeight: 'bold' }}>{service}</Text> service has been successfully booked.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleHome}>
        <Text style={styles.buttonText}>Book Another Service</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 20, backgroundColor: '#fff'
  },
  image: {
    width: 120, height: 120, marginBottom: 30, resizeMode: 'contain'
  },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#1A73E8', marginBottom: 10
  },
  subtitle: {
    fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 30
  },
  button: {
    backgroundColor: '#1A73E8', paddingVertical: 12, paddingHorizontal: 25,
    borderRadius: 10
  },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold'
  },
});
