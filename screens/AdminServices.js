// screens/AdminServices.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../firebase';
import {
  ref as dbRef,
  onValue,
  push,
  update,
  remove,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [icon, setIcon] = useState(null);
  const [editId, setEditId] = useState(null);
  const [visible, setVisible] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const servicesRef = dbRef(db, 'services');
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setServices(list);
    });
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ FIXED
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIcon(result.assets[0].uri);
        console.log("Selected icon URI:", result.assets[0].uri);
      }
    } catch (err) {
      console.error("Image Picker Error:", err);
      Alert.alert("Image Picker Error", err.message);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Validation', 'Name and Price are required');
      return;
    }

    try {
      let iconUrl = '';
      if (icon && icon.startsWith('file')) {
        const response = await fetch(icon);
        const blob = await response.blob();
        const imgRef = storageRef(storage, `services/${Date.now()}.jpg`);
        await uploadBytes(imgRef, blob);
        iconUrl = await getDownloadURL(imgRef);
      } else if (icon) {
        iconUrl = icon;
      }

      const data = {
        name,
        price: parseFloat(price),
        icon: iconUrl,
        visible,
      };

      if (editId) {
        await update(dbRef(db, `services/${editId}`), data);
        setEditId(null);
      } else {
        await push(dbRef(db, 'services'), data);
      }

      resetForm();
    } catch (err) {
      console.error("Image upload error:", err);
      Alert.alert("Upload Error", err.message || "Failed to upload icon.");
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setIcon(null);
    setEditId(null);
    setVisible(true);
  };

  const handleEdit = (item) => {
    setName(item.name);
    setPrice(item.price.toString());
    setIcon(item.icon);
    setVisible(item.visible ?? true);
    setEditId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove(dbRef(db, `services/${id}`)),
      },
    ]);
  };

  const toggleVisibility = async (item) => {
    await update(dbRef(db, `services/${item.id}`), {
      visible: !item.visible,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.icon }} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
      </View>
      <Switch
        value={item.visible ?? true}
        onValueChange={() => toggleVisibility(item)}
      />
      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
        <Text style={styles.btnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Text style={styles.btnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Manage Main Services</Text>
        </View>

        <View style={styles.container}>
          <TextInput
            placeholder="Service Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Base Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.input}
          />
          <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
            <Text style={{ fontWeight: 'bold' }}>
              {icon ? 'Change Icon' : 'Upload Icon'}
            </Text>
          </TouchableOpacity>
          {icon && <Image source={{ uri: icon }} style={styles.preview} />}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {editId ? 'Update' : 'Add'} Service
            </Text>
          </TouchableOpacity>

          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 16 }}
            style={{ marginTop: 10 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AdminServices;

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    paddingHorizontal: 12,
    elevation: 4,
  },
  appBarIcon: {
    marginRight: 12,
  },
  appBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  uploadBtn: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  preview: {
    height: 60,
    width: 60,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  saveBtn: {
    backgroundColor: '#1A73E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  icon: {
    height: 40,
    width: 40,
    borderRadius: 6,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 13,
    color: '#333',
  },
  editBtn: {
    marginLeft: 8,
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    marginLeft: 8,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
