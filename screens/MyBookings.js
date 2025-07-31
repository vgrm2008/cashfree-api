// screens/MyBookings.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ref, onValue, off, update } from 'firebase/database';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState(null);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserPhone = async () => {
      try {
        const phone = await AsyncStorage.getItem('userPhone');
        console.log('Fetched userPhone:', phone);
        if (phone) {
          setUserPhone(phone);
          fetchBookings(phone);
        } else {
          console.warn('No userPhone found in AsyncStorage');
          setLoading(false);
        }
      } catch (error) {
        console.log('Error fetching user phone:', error);
        setLoading(false);
      }
    };

    fetchUserPhone();

    // Cleanup listener on unmount
    return () => {
      off(ref(db, 'bookings'));
    };
  }, []);

  const fetchBookings = (phone) => {
    const bookingsRef = ref(db, 'bookings');
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.entries(data);
        const userBookings = entries
          .map(([id, value]) => ({ id, ...value }))
          .filter((booking) => {
            console.log('Checking booking:', booking.phone, '===', phone);
            return booking.phone === phone;
          });

        const sorted = userBookings.sort(
          (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
        );

        setBookings(sorted);
        setFilteredBookings(sorted);
      } else {
        setBookings([]);
        setFilteredBookings([]);
      }
      setLoading(false);
    });
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter((booking) =>
        booking.name?.toLowerCase().includes(text.toLowerCase()) ||
        booking.phone?.includes(text)
      );
      setFilteredBookings(filtered);
    }
  };

  const handleEdit = (booking) => {
    if (booking.status === 'Pending') {
      navigation.navigate('Book Service', {
        screen: 'BookingForm',
        params: {
          service: booking.service,
          selectedSubServices: booking.subServices,
          address: booking.address,
          city: booking.city,
          state: booking.state,
          pincode: booking.pincode,
          editMode: true,
          bookingId: booking.id,
          name: booking.name,
          phone: booking.phone,
          date: booking.date,
          timeSlot: booking.timeSlot,
        },
      });
    } else {
      Alert.alert('Cannot Edit', 'This booking is already confirmed or scheduled.');
    }
  };

  const handleCancel = (booking) => {
    const visitDate = new Date(booking.date + ' ' + booking.timeSlot?.split('–')[0]);
    const now = new Date();
    const timeDiff = visitDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      Alert.alert('Too Late', 'You can’t cancel bookings within 24 hours of visit time.');
      return;
    }

    Alert.alert('Confirm Cancel', 'Do you want to cancel this booking?', [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Yes, Cancel',
        onPress: () => {
          update(ref(db, `bookings/${booking.id}`), { status: 'Cancelled by Customer' });
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.service}</Text>
      {item.subServices && item.subServices.map((s, i) => (
        <Text key={i} style={styles.subItem}>• {s.name} - ₹{s.price}</Text>
      ))}
      <Text style={styles.text}>Name: {item.name}</Text>
      <Text style={styles.text}>Phone: {item.phone}</Text>
      <Text style={styles.text}>Date: {item.date} | {item.timeSlot}</Text>
      <Text style={styles.text}>Address: {item.address}, {item.city}, {item.state} - {item.pincode}</Text>
      <Text style={styles.text}>Total: ₹{item.total || 0}</Text>
      <Text style={[styles.status, getStatusStyle(item.status)]}>Status: {item.status}</Text>

      {item.status === 'Pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return { color: '#4CAF50' };
      case 'Pending': return { color: '#FF9800' };
      case 'Engineer Visit Scheduled': return { color: '#2196F3' };
      case 'Cancelled by Customer': return { color: '#F44336' };
      default: return { color: '#757575' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or phone"
        value={searchText}
        onChangeText={handleSearch}
      />
      {filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.noData}>No bookings found.</Text>
        </View>
      )}
    </View>
  );
};

export default MyBookings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f4f8',
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A73E8',
    marginBottom: 6,
  },
  subItem: {
    fontSize: 13,
    color: '#555',
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  status: {
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#1A73E8',
    marginRight: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noData: {
    fontSize: 16,
    color: 'gray',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
