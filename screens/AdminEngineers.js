// AdminEngineers.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Alert, Modal, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { ref, set, remove, onValue, update } from 'firebase/database';
import uuid from 'react-native-uuid';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminEngineers = () => {
  const navigation = useNavigation();
  const [engineers, setEngineers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', location: '', serviceType: '' });
  const [searchText, setSearchText] = useState('');
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const engineersRef = ref(db, 'engineers');
    onValue(engineersRef, (snapshot) => {
      const data = snapshot.val();
      const parsed = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      setEngineers(parsed);
    });
  }, []);

  const handleAddOrUpdateEngineer = async () => {
    const { name, phone, location, serviceType } = form;
    if (!name || !phone || !location || !serviceType) {
      Alert.alert('All fields are required');
      return;
    }

    if (editingEngineer) {
      await update(ref(db, `engineers/${editingEngineer.id}`), { name, phone, location, serviceType });
      Alert.alert('Engineer updated');
    } else {
      const id = uuid.v4();
      await set(ref(db, `engineers/${id}`), { name, phone, location, serviceType });
      Alert.alert('Engineer added');
    }

    setForm({ name: '', phone: '', location: '', serviceType: '' });
    setEditingEngineer(null);
    setModalVisible(false);
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this engineer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => await remove(ref(db, `engineers/${id}`))
      },
    ]);
  };

  const handleEdit = (engineer) => {
    setForm({
      name: engineer.name,
      phone: engineer.phone,
      location: engineer.location,
      serviceType: engineer.serviceType
    });
    setEditingEngineer(engineer);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>📞 {item.phone}</Text>
      <Text>📍 {item.location}</Text>
      <Text>🛠 {item.serviceType}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtnGreen}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtnRed}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredEngineers = engineers.filter((eng) =>
    eng.name.toLowerCase().includes(searchText.toLowerCase()) ||
    eng.phone.includes(searchText)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Material App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarBtn}>
          <Text style={styles.appBarIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Manage Engineers</Text>
      </View>

      <View style={styles.container}>
        <TextInput
          placeholder="Search by name or phone"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
          placeholderTextColor="#666"
        />

        <TouchableOpacity onPress={() => {
          setForm({ name: '', phone: '', location: '', serviceType: '' });
          setEditingEngineer(null);
          setModalVisible(true);
        }} style={styles.addBtn}>
          <Text style={styles.addText}>+ Add Engineer</Text>
        </TouchableOpacity>

        <FlatList
          data={filteredEngineers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalHeading}>
                {editingEngineer ? 'Edit Engineer' : 'Add Engineer'}
              </Text>

              <TextInput
                placeholder="Engineer Name"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                style={styles.input}
              />
              <TextInput
                placeholder="Phone"
                keyboardType="number-pad"
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                style={styles.input}
              />
              <TextInput
                placeholder="Location"
                value={form.location}
                onChangeText={(text) => setForm({ ...form, location: text })}
                style={styles.input}
              />
              <TextInput
                placeholder="Service Type"
                value={form.serviceType}
                onChangeText={(text) => setForm({ ...form, serviceType: text })}
                style={styles.input}
              />

              <TouchableOpacity onPress={handleAddOrUpdateEngineer} style={styles.addBtn}>
                <Text style={styles.addText}>
                  {editingEngineer ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.actionBtnRed}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AdminEngineers;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 3,
  },
  appBarBtn: { marginRight: 10 },
  appBarIcon: { color: '#fff', fontSize: 20 },
  appBarTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#1A73E8', textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#fff',
    color: '#000',
  },
  addBtn: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    elevation: 2,
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionBtnGreen: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  actionBtnRed: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
  },
  btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
});
