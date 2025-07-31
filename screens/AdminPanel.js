// AdminPanel.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert,
  TouchableOpacity, Modal, Linking, TextInput, ToastAndroid
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { db } from '../firebase';
import { onValue, ref, update, off } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';

const formatDate = (date) => new Date(date).toISOString().split('T')[0];

const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [searchText, setSearchText] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [bulkStatus, setBulkStatus] = useState('');
  const [showFABMenu, setShowFABMenu] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings');
    const engineersRef = ref(db, 'engineers');

    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      setBookings(loaded);
    });

    onValue(engineersRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = data
        ? Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .filter((eng) => eng.name?.trim() && eng.phone?.trim())
        : [];
      setEngineers(loaded);
    });

    return () => {
      off(bookingsRef);
      off(engineersRef);
    };
  }, []);

  useEffect(() => {
    let filtered = [...bookings];
    if (filterStatus !== 'All') {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }
    if (fromDate) {
      filtered = filtered.filter((b) => new Date(b.date) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter((b) => new Date(b.date) <= new Date(toDate));
    }
    if (searchText.trim()) {
      filtered = filtered.filter((b) =>
        b.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        b.phone?.includes(searchText)
      );
    }
    filtered.sort((a, b) => new Date(b.dateTime || '') - new Date(a.dateTime || ''));
    setFilteredBookings(filtered);
  }, [bookings, filterStatus, searchText, fromDate, toDate]);

  const toggleSelect = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((b) => b.id));
    }
  };

  const applyBulkStatus = () => {
    if (!bulkStatus) return Alert.alert('Please select a status');
    selectedBookings.forEach((id) => {
      update(ref(db, `bookings/${id}`), { status: bulkStatus });
    });
    ToastAndroid.show('Bulk status updated', ToastAndroid.SHORT);
    setBulkStatus('');
    setSelectedBookings([]);
  };

  const renderItem = ({ item }) => {
    const engineer = engineers.find((eng) => eng.phone === item.assignedEngineer);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Checkbox value={selectedBookings.includes(item.id)} onValueChange={() => toggleSelect(item.id)} />
          <Text style={styles.cardTitle}>{item.service}</Text>
        </View>
        <Text>{item.name} | {item.phone}</Text>
        <Text>{item.date} | {item.timeSlot}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 5 }}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <Text style={styles.linkBtn}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const loc = item.location;
            if (loc?.latitude && loc?.longitude) {
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`);
            }
          }}>
            <Text style={styles.linkBtn}>📍 Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dropdownWrapper}>
          <Picker
            selectedValue={item.status}
            onValueChange={(val) => update(ref(db, `bookings/${item.id}`), { status: val })}
            style={styles.dropdown}
            dropdownIconColor="#333"
            mode="dropdown"
          >
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Booking Confirmed" value="Booking Confirmed" />
            <Picker.Item label="Engineer Visit Scheduled" value="Engineer Visit Scheduled" />
            <Picker.Item label="Completed" value="Completed" />
            <Picker.Item label="Cancelled" value="Cancelled" />
          </Picker>
        </View>

        {engineer ? (
          <Text>👨‍🔧 {engineer.name}</Text>
        ) : (
          <Text style={{ color: 'red' }}>⚠️ No Engineer Assigned</Text>
        )}

        <TouchableOpacity style={styles.assignBtn} onPress={() => {
          setSelectedBooking(item);
          setSelectedEngineer(item.assignedEngineer || '');
          setModalVisible(true);
        }}>
          <Text style={styles.btnText}>Assign</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Admin Panel</Text>
      <TextInput style={styles.input} placeholder="🔍 Search by name or phone" value={searchText} onChangeText={setSearchText} />

      <View style={styles.row}>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.filterBtn}>
          <Text>From: {fromDate ? formatDate(fromDate) : '📅'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.filterBtn}>
          <Text>To: {toDate ? formatDate(toDate) : '📅'}</Text>
        </TouchableOpacity>
        <View style={styles.dropdownWrapper}>
          <Picker
            selectedValue={filterStatus}
            onValueChange={setFilterStatus}
            style={styles.dropdown}
            dropdownIconColor="#333"
            mode="dropdown"
          >
            <Picker.Item label="All" value="All" />
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Booking Confirmed" value="Booking Confirmed" />
            <Picker.Item label="Engineer Visit Scheduled" value="Engineer Visit Scheduled" />
            <Picker.Item label="Completed" value="Completed" />
            <Picker.Item label="Cancelled" value="Cancelled" />
          </Picker>
        </View>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => { setShowFromPicker(false); if (d) setFromDate(d); }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => { setShowToPicker(false); if (d) setToDate(d); }}
        />
      )}

      <View style={styles.bulkRow}>
        <TouchableOpacity onPress={toggleSelectAll} style={styles.bulkBtn}>
          <Text style={styles.btnText}>
            {selectedBookings.length === filteredBookings.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        <View style={[styles.dropdownWrapper, { flex: 1 }]}>
          <Picker
            selectedValue={bulkStatus}
            onValueChange={setBulkStatus}
            style={styles.dropdown}
            dropdownIconColor="#333"
            mode="dropdown"
          >
            <Picker.Item label="Bulk Update Status" value="" />
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Booking Confirmed" value="Booking Confirmed" />
            <Picker.Item label="Engineer Visit Scheduled" value="Engineer Visit Scheduled" />
            <Picker.Item label="Completed" value="Completed" />
            <Picker.Item label="Cancelled" value="Cancelled" />
          </Picker>
        </View>
        <TouchableOpacity onPress={applyBulkStatus} style={styles.bulkBtn}>
          <Text style={styles.btnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={filteredBookings} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 80 }} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Assign Engineer</Text>
            <Picker selectedValue={selectedEngineer} onValueChange={setSelectedEngineer}>
              <Picker.Item label="Select Engineer" value="" />
              {engineers.map((eng) => (
                <Picker.Item key={eng.id} label={`${eng.name} (${eng.phone})`} value={eng.phone} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.assignBtn} onPress={() => {
              if (selectedBooking && selectedEngineer) {
                update(ref(db, `bookings/${selectedBooking.id}`), {
                  assignedEngineer: selectedEngineer,
                  status: 'Engineer Visit Scheduled',
                });
                setModalVisible(false);
              }
            }}>
              <Text style={styles.btnText}>Assign</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowFABMenu(!showFABMenu)}>
        <Ionicons name="menu" size={26} color="#fff" />
      </TouchableOpacity>
      {showFABMenu && (
        <View style={styles.fabMenu}>
          <TouchableOpacity style={styles.fabItem} onPress={() => navigation.navigate('AdminEngineers')}>
            <Text>👷 Engineers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabItem} onPress={() => navigation.navigate('AdminServices')}>
            <Text>🛠 Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabItem} onPress={() => navigation.navigate('AdminSubServices')}>
            <Text>🧩 Sub-Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabItem} onPress={() => navigation.navigate('AdminViewOrders')}>
            <Text>📄 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabItem} onPress={async () => {
            const header = 'Name,Phone,Date,Service,Status\n';
            const rows = filteredBookings.map((b) =>
              `${b.name},${b.phone},${b.date},${b.service},${b.status}`
            ).join('\n');
            const path = FileSystem.documentDirectory + 'bookings.csv';
            await FileSystem.writeAsStringAsync(path, header + rows);
            await Sharing.shareAsync(path);
          }}>
            <Text>📤 Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabItem} onPress={() => navigation.replace('CustomerLogin')}>
            <Text>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AdminPanel;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f9f9f9' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 6, marginBottom: 10, borderColor: '#ccc', borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  filterBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6 },
  bulkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  bulkBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  linkBtn: { color: '#007AFF', fontWeight: 'bold', marginRight: 10 },
  dropdownWrapper: { backgroundColor: '#f1f1f1', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
  dropdown: { height: 45, fontSize: 14 },
  assignBtn: { backgroundColor: '#28a745', padding: 10, marginTop: 8, borderRadius: 6, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#ccc', padding: 10, marginTop: 8, borderRadius: 6, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF', padding: 14, borderRadius: 30, elevation: 4 },
  fabMenu: { position: 'absolute', bottom: 80, right: 20, backgroundColor: '#fff', borderRadius: 10, padding: 8, elevation: 6 },
  fabItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
