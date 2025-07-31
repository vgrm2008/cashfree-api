import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export default function AdminViewOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = ref(db, 'bookings/');
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const orderList = data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : [];
      setOrders(orderList.reverse());
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 50 }} />;
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.name} ({item.phone})</Text>
          <Text>{item.service} - {item.subService}</Text>
          <Text>₹{item.price} | {item.date} | {item.timeSlot}
          </Text>
          <Text>{item.address}, {item.state} - {item.pincode}</Text>
          <Text style={styles.status}>Status: {item.status}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#1A237E'
  },
  status: {
    marginTop: 6,
    color: '#1A73E8',
    fontWeight: '600'
  }
});

