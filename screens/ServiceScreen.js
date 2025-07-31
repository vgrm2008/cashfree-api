// screens/ServiceScreen.js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const services = [
  {
    name: 'AC Repair',
    icon: require('../assets/ac-repair.png'),
  },
  {
    name: 'AC Installation',
    icon: require('../assets/ac-install.png'),
  },
  {
    name: 'AC Servicing',
    icon: require('../assets/gas-refill.png'),
  },
  {
    name: 'Electrician',
    icon: require('../assets/electrician.png'),
  },
];

const ServiceScreen = () => {
  const navigation = useNavigation();

  const handleServicePress = (serviceName) => {
    navigation.navigate('SubServices', { service: serviceName });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Service</Text>
      <FlatList
        data={services}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleServicePress(item.name)}
          >
            <Image source={item.icon} style={styles.icon} resizeMode="contain" />
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ServiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  list: {
    paddingBottom: 20
  },
  card: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    margin: 8,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  }
});
