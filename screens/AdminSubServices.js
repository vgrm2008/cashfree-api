// screens/AdminSubServices.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  Image, TouchableOpacity, Alert, Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../firebase';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AdminSubServices = () => {
  const navigation = useNavigation();
  const [subServiceName, setSubServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [iconUri, setIconUri] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [subServices, setSubServices] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'services'), (snapshot) => {
      const data = snapshot.val() || {};
      const loaded = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setServices(loaded);
      if (loaded.length > 0 && !selectedServiceId) {
        setSelectedServiceId(loaded[0].id);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      const subRef = ref(db, `subServices/${selectedServiceId}`);
      const unsubscribe = onValue(subRef, (snapshot) => {
        const data = snapshot.val() || {};
        const loaded = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setSubServices(loaded);
      });
      return () => unsubscribe();
    }
  }, [selectedServiceId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setIconUri(result.assets[0].uri);
    }
  };

  const uploadIcon = async (uri) => {
    const blob = await fetch(uri).then((res) => res.blob());
    const filename = `subServices/${Date.now()}.jpg`;
    const storageRef = sRef(storage, filename);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!subServiceName || !price || !selectedServiceId || (!iconUri && !editMode)) {
      return Alert.alert('Please fill all fields and pick an icon');
    }
    try {
      let iconUrl = null;
      if (iconUri) {
        iconUrl = await uploadIcon(iconUri);
      }

      const data = {
        name: subServiceName,
        price: parseFloat(price),
        icon: iconUrl || undefined,
        visible: true,
      };

      if (editMode) {
        await update(ref(db, `subServices/${selectedServiceId}/${editingId}`), data);
        setEditMode(false);
        setEditingId(null);
      } else {
        await push(ref(db, `subServices/${selectedServiceId}`), data);
      }

      setSubServiceName('');
      setPrice('');
      setIconUri(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Upload failed');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove(ref(db, `subServices/${selectedServiceId}/${id}`)),
      },
    ]);
  };

  const handleEdit = (item) => {
    setSubServiceName(item.name);
    setPrice(item.price.toString());
    setIconUri(null);
    setEditMode(true);
    setEditingId(item.id);
  };

  const toggleVisibility = (item) => {
    update(ref(db, `subServices/${selectedServiceId}/${item.id}`), {
      visible: !item.visible,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sub-Service Management</Text>
      </View>

      <Picker
        selectedValue={selectedServiceId}
        onValueChange={(val) => setSelectedServiceId(val)}
        style={styles.picker}
      >
        {services.map((s) => (
          <Picker.Item key={s.id} label={s.name} value={s.id} />
        ))}
      </Picker>

      <TextInput
        placeholder="Sub-Service Name"
        style={styles.input}
        value={subServiceName}
        onChangeText={setSubServiceName}
      />
      <TextInput
        placeholder="Price"
        keyboardType="numeric"
        style={styles.input}
        value={price}
        onChangeText={setPrice}
      />

      <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
        <Text style={styles.imageText}>{iconUri ? 'Change Icon' : 'Pick Icon'}</Text>
      </TouchableOpacity>

      {iconUri && <Image source={{ uri: iconUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
        <Text style={styles.saveText}>{editMode ? 'Update' : 'Add'} Sub-Service</Text>
      </TouchableOpacity>

      <FlatList
        data={subServices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.icon }} style={styles.icon} />
            <View style={{ flex: 1 }}>
              <Text>{item.name}</Text>
              <Text>₹{item.price}</Text>
            </View>
            <Switch
              value={item.visible}
              onValueChange={() => toggleVisibility(item)}
            />
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ margin: 20 }}>No sub-services yet.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

export default AdminSubServices;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  picker: { marginHorizontal: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 10, margin: 10,
    backgroundColor: '#f9f9f9',
  },
  imageBtn: {
    backgroundColor: '#1A73E8',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  imageText: { color: '#fff', fontWeight: 'bold' },
  preview: { width: 60, height: 60, margin: 10, borderRadius: 8, alignSelf: 'center' },
  saveBtn: {
    backgroundColor: '#34C759',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    gap: 8,
  },
  icon: { width: 40, height: 40, borderRadius: 6, marginRight: 10 },
  editBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
