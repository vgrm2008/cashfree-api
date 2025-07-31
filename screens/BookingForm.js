// screens/BookingForm.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const timeSlots = [
  '9:30 AM – 11:30 AM',
  '11:30 AM – 01:30 PM',
  '01:30 PM – 03:30 PM',
  '03:30 PM – 05:30 PM',
  '05:30 PM – 07:30 PM'
];

const BookingForm = ({ route, navigation }) => {
  const {
    service,
    selectedSubServices = [],
    address: autoAddress = '',
    city: autoCity = '',
    state: autoState = '',
    pincode: autoPincode = '',
    editMode = false,
    bookingId = null,
    name: editName = '',
    phone: editPhone = '',
    date: editDate = null,
    timeSlot: editSlot = '',
    location = null,
  } = route.params;

  const [name, setName] = useState(editName);
  const [phone, setPhone] = useState(editPhone);
  const [address, setAddress] = useState(autoAddress);
  const [city, setCity] = useState(autoCity);
  const [state, setState] = useState(autoState);
  const [pincode, setPincode] = useState(autoPincode);
  const [date, setDate] = useState(editDate ? new Date(editDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(editSlot);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const subtotal = selectedSubServices.reduce((sum, item) => sum + (item.price || 0), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleBooking = async () => {
    if (!name || !phone || !address || !city || !state || !pincode || !selectedTimeSlot) {
      Alert.alert('Missing Fields', 'Please fill all details and select a time slot.');
      return;
    }

    const bookingData = {
      service,
      subServices: selectedSubServices,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      date: date.toDateString(),
      timeSlot: selectedTimeSlot,
      subtotal,
      gst,
      total,
      dateTime: new Date().toISOString(),
      location: location || null,
    };

    if (!editMode) {
      bookingData.status = 'Pending';
    }

    try {
      if (editMode && bookingId) {
        // Update existing booking directly
        const { db } = require('../firebase');
        const { ref, update } = require('firebase/database');
        await update(ref(db, `bookings/${bookingId}`), bookingData);
        setSnackbarVisible(true);
        setTimeout(() => {
          navigation.navigate('My Bookings');
        }, 1000);
      } else {
        // Redirect to payment screen with bookingData
        await AsyncStorage.setItem('userPhone', phone);
        navigation.navigate('PaymentScreen', { bookingData });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process booking: ' + error.message);
    }
  };

  const renderInput = (icon, placeholder, value, setValue, keyboardType = 'default', maxLength = null) => (
    <View style={styles.inputWrapper}>
      {icon}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#888"
        style={styles.inputField}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>{editMode ? 'Edit Booking' : `Booking for: ${service}`}</Text>

        {selectedSubServices.map((item, index) => (
          <Text key={index} style={styles.subService}>
            • {item.name} - ₹{item.price}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Your Details</Text>

        {renderInput(<Ionicons name="person" size={20} color="#888" />, 'Name', name, setName)}
        {renderInput(<Ionicons name="call" size={20} color="#888" />, 'Phone Number', phone, setPhone, 'phone-pad', 10)}
        {renderInput(<Ionicons name="home" size={20} color="#888" />, 'Full Address', address, setAddress)}
        {renderInput(<MaterialIcons name="location-city" size={20} color="#888" />, 'City', city, setCity)}
        {renderInput(<MaterialIcons name="map" size={20} color="#888" />, 'State', state, setState)}
        {renderInput(<MaterialIcons name="pin-drop" size={20} color="#888" />, 'Pincode', pincode, setPincode, 'number-pad')}

        <Text style={styles.sectionTitle}>Booking Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
          <Text>{date.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Time Slot</Text>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.timeSlot, selectedTimeSlot === slot && styles.selectedTimeSlot]}
            onPress={() => setSelectedTimeSlot(slot)}
          >
            <Text style={{ color: selectedTimeSlot === slot ? '#fff' : '#333' }}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.summary}>
          <Text>Subtotal: ₹{subtotal.toFixed(2)}</Text>
          <Text>GST (18%): ₹{gst.toFixed(2)}</Text>
          <Text style={styles.total}>Total: ₹{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={handleBooking}>
          <Text style={styles.bookText}>{editMode ? 'Update Booking' : 'Proceed to Pay'}</Text>
        </TouchableOpacity>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{ backgroundColor: '#4CAF50' }}
        >
          {editMode ? 'Booking updated successfully!' : 'Booking confirmed successfully!'}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BookingForm;

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    padding: 16,
    backgroundColor: '#f5f7fa',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A73E8',
    textAlign: 'center',
  },
  subService: {
    fontSize: 15,
    marginBottom: 6,
    color: '#333',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontWeight: '600',
    fontSize: 17,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 2,
  },
  inputField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  datePicker: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  timeSlot: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedTimeSlot: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  summary: {
    marginTop: 24,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    elevation: 3,
  },
  total: {
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 16,
    color: '#1A73E8',
  },
  bookBtn: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  bookText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textTransform: 'uppercase',
  },
});
