// EngineerDashboard.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Alert,
  ActivityIndicator, TextInput, Platform
} from 'react-native';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const EngineerDashboard = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [engineerName, setEngineerName] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const phone = await AsyncStorage.getItem('phone');
      const name = await AsyncStorage.getItem('userName');
      setUserPhone(phone || '');
      setEngineerName(name || '');

      const db = getDatabase();
      const bookingsRef = ref(db, 'bookings');
      onValue(bookingsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const assigned = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .filter((b) => b.assignedEngineer === phone);
        setBookings(assigned);
        setLoading(false);
      });
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...bookings];
    if (statusFilter !== 'All') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }
    if (fromDate) {
      filtered = filtered.filter((b) => new Date(b.date) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter((b) => new Date(b.date) <= new Date(toDate));
    }
    setFilteredBookings(filtered);
  }, [bookings, statusFilter, fromDate, toDate]);

  const handleStatusChange = async (id, newStatus) => {
    const db = getDatabase();
    const bookingRef = ref(db, `bookings/${id}`);
    const updates = {
      status: newStatus,
      statusUpdatedAt: new Date().toISOString(),
    };
    const booking = bookings.find((b) => b.id === id);
    if (!booking?.engineerName && engineerName) {
      updates.engineerName = engineerName;
    }

    try {
      await update(bookingRef, updates);
      Alert.alert('Success', 'Status updated');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSaveComment = async (id) => {
    const comment = commentInputs[id];
    if (!comment || !comment.trim()) {
      Alert.alert('Comment is required');
      return;
    }
    try {
      await update(ref(getDatabase(), `bookings/${id}`), {
        engineerComment: comment,
      });
      Alert.alert('Saved', 'Comment saved');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['isLoggedIn', 'isAdmin', 'phone', 'userName', 'role']);
    navigation.reset({ index: 0, routes: [{ name: 'CustomerLogin' }] });
  };

  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const pendingCount = bookings.filter((b) => b.status !== 'Completed').length;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.service} - {item.date}</Text>
      <Text>Customer: {item.name}</Text>
      <Text>Phone: {item.phone}</Text>
      <Text>Address: {item.address}</Text>

      <View style={styles.pickerWrapper}>
        <Text>Status:</Text>
        <Picker
          selectedValue={item.status || 'Pending'}
          onValueChange={(value) => handleStatusChange(item.id, value)}
          style={styles.picker}
        >
          <Picker.Item label="Pending" value="Pending" />
          <Picker.Item label="In Progress" value="In Progress" />
          <Picker.Item label="Completed" value="Completed" />
          <Picker.Item label="Revisit Required" value="Revisit Required" />
          <Picker.Item label="On Hold" value="On Hold" />
          <Picker.Item label="Cancelled" value="Cancelled" />
        </Picker>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
          <Ionicons name="call-outline" size={24} color="green" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${item.phone}`)} style={{ marginLeft: 16 }}>
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
      </View>

      {(item.status === 'Completed' || item.status === 'Revisit Required') && (
        <>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Engineer Comment:</Text>
          <TextInput
            placeholder="Write completion comment"
            value={commentInputs[item.id] || ''}
            onChangeText={(text) =>
              setCommentInputs((prev) => ({ ...prev, [item.id]: text }))
            }
            multiline
            numberOfLines={3}
            style={styles.commentInput}
          />
          <TouchableOpacity style={styles.uploadBtn} onPress={() => handleSaveComment(item.id)}>
            <Text style={styles.uploadText}>💾 Save Comment</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{engineerName}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="red" />
        </TouchableOpacity>
      </View>

      <Text style={styles.summary}>✅ Completed: {completedCount}    ⏳ Pending: {pendingCount}</Text>

      <View style={styles.filterRow}>
        <Picker selectedValue={statusFilter} onValueChange={setStatusFilter} style={styles.picker}>
          <Picker.Item label="All Bookings" value="All" />
          <Picker.Item label="Pending" value="Pending" />
          <Picker.Item label="In Progress" value="In Progress" />
          <Picker.Item label="Completed" value="Completed" />
          <Picker.Item label="Revisit Required" value="Revisit Required" />
          <Picker.Item label="On Hold" value="On Hold" />
          <Picker.Item label="Cancelled" value="Cancelled" />
        </Picker>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateBtn}>
          <Text>{fromDate ? `From: ${formatDate(fromDate)}` : '📅 From Date'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateBtn}>
          <Text>{toDate ? `To: ${formatDate(toDate)}` : '📅 To Date'}</Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate ? new Date(fromDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setFromDate(formatDate(selectedDate));
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate ? new Date(toDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) setToDate(formatDate(selectedDate));
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold' },
  summary: {
    fontWeight: 'bold',
    backgroundColor: '#e8f0fe',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
    textAlign: 'center',
  },
  filterRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between' },
  dateBtn: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  pickerWrapper: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  picker: { height: 40, width: '100%' },
  actions: { flexDirection: 'row', marginTop: 8 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  uploadBtn: {
    backgroundColor: '#1A73E8',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  uploadText: { color: '#fff', fontWeight: 'bold' },
});

export default EngineerDashboard;
