import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert
} from 'react-native';
import * as Location from 'expo-location';

const subServicesData = {
  'AC Repair': [
    { name: 'Cooling Issue', price: 350, icon: require('../assets/cooling.png') },
    { name: 'No Power', price: 400, icon: require('../assets/no-power.png') },
    { name: 'Water Leakage', price: 300, icon: require('../assets/water-leak.png') },
    { name: 'Compressor Fault', price: 700, icon: require('../assets/compressor.png') }
  ],
  'AC Installation': [
    { name: 'Window AC Install', price: 600, icon: require('../assets/window-install.png') },
    { name: 'Split AC Install', price: 800, icon: require('../assets/split-install.png') }
  ],
  'AC Servicing': [
    { name: 'General Service', price: 499, icon: require('../assets/general-service.png') },
    { name: 'Jet Pump Service', price: 699, icon: require('../assets/jet-pump.png') },
    { name: 'Gas Refill', price: 1200, icon: require('../assets/gas-refill.png') }
  ],
  'Electrician': [
    { name: 'Fan Repair', price: 199, icon: require('../assets/fan-repair.png') },
    { name: 'Switch Replacement', price: 149, icon: require('../assets/switch.png') }
  ]
};

const SubServicesScreen = ({ route, navigation }) => {
  const { service } = route.params;
  const subServices = subServicesData[service] || [];
  const [selectedServices, setSelectedServices] = useState([]);
  const [locationInfo, setLocationInfo] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to auto-fill address.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync(loc.coords);
      const place = geocode[0];

      setLocationInfo({
        address: `${place.name || ''} ${place.street || ''}`.trim(),
        city: place.city || '',
        state: place.region || '',
        pincode: place.postalCode || ''
      });
    })();
  }, []);

  const toggleSelect = (subService) => {
    const exists = selectedServices.some(item => item.name === subService.name);
    if (exists) {
      setSelectedServices(selectedServices.filter(item => item.name !== subService.name));
    } else {
      setSelectedServices([...selectedServices, subService]);
    }
  };

  const proceedToBook = () => {
    if (!locationInfo) {
      Alert.alert('Fetching Location', 'Please wait, location is still loading...');
      return;
    }

    navigation.navigate('BookingForm', {
      service,
      selectedSubServices: selectedServices,
      ...locationInfo
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select {service} Sub Services</Text>
      <FlatList
        data={subServices}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const selected = selectedServices.some(s => s.name === item.name);
          return (
            <TouchableOpacity
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => toggleSelect(item)}
            >
              <Image source={item.icon} style={styles.icon} resizeMode="contain" />
              <Text style={styles.cardText}>{item.name}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {selectedServices.length > 0 && (
        <TouchableOpacity style={styles.button} onPress={proceedToBook}>
          <Text style={styles.buttonText}>Proceed to Book ({selectedServices.length} Selected)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SubServicesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  list: {
    gap: 12
  },
  card: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cardSelected: {
    backgroundColor: '#cceeff',
    borderColor: '#007AFF',
    borderWidth: 1
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 8
  },
  cardText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  price: {
    fontSize: 12,
    color: '#555',
    marginTop: 4
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
