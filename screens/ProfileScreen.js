import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get, set } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const db = getDatabase();
const storage = getStorage();

const ProfileScreen = () => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', pincode: '' });

  useEffect(() => {
    const loadProfile = async () => {
      const storedMobile = await AsyncStorage.getItem('userMobile');
      if (storedMobile) {
        setMobile(storedMobile);
        const userRef = ref(db, `users/${storedMobile}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setName(data.name || '');
          setEmail(data.email || '');
          setAddresses(data.addresses || []);
          setProfileImage(data.profileImage || null);
        }
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    if (!name || !email) {
      Alert.alert('Please fill all fields');
      return;
    }
    try {
      await set(ref(db, `users/${mobile}`), {
        name,
        email,
        addresses,
        profileImage,
      });
      Alert.alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to save profile');
    }
  };

  const addAddress = () => {
    const { label, address, pincode } = newAddress;
    if (!label || !address || !pincode) {
      Alert.alert('Please fill all address fields');
      return;
    }
    const updated = [...addresses, newAddress];
    setAddresses(updated);
    setNewAddress({ label: '', address: '', pincode: '' });
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need media access to upload image.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const blob = await fetch(uri).then((r) => r.blob());
        const imageRef = sRef(storage, `profileImages/${mobile}_${Date.now()}.jpg`);
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);
        setProfileImage(downloadURL);
        Alert.alert('Profile picture uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload failed', err.message);
    }
  };

  const renderAddress = ({ item }) => (
    <View style={styles.addressCard}>
      <Text style={styles.addressLabel}>{item.label}</Text>
      <Text>{item.address}</Text>
      <Text>Pincode: {item.pincode}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Profile</Text>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickProfileImage}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.avatarText}>
          {profileImage ? 'Tap to change' : 'Default Avatar (Tap to Upload)'}
        </Text>
      </View>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />

      <Text style={styles.subheading}>Saved Addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderAddress}
        ListEmptyComponent={<Text style={{ marginVertical: 10 }}>No addresses saved yet.</Text>}
      />

      <Text style={styles.subheading}>Add New Address</Text>

      <TextInput
        placeholder="Label (e.g. Home, Office)"
        placeholderTextColor="#666"
        value={newAddress.label}
        onChangeText={(text) => setNewAddress({ ...newAddress, label: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Full Address"
        placeholderTextColor="#666"
        value={newAddress.address}
        onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Pincode"
        placeholderTextColor="#666"
        value={newAddress.pincode}
        onChangeText={(text) => setNewAddress({ ...newAddress, pincode: text })}
        keyboardType="number-pad"
        style={styles.input}
      />

      <TouchableOpacity onPress={addAddress} style={styles.addButton}>
        <Text style={styles.buttonText}>+ Add Address</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={saveProfile} style={styles.saveButton}>
        <Text style={styles.buttonText}>💾 Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    color: '#000'
  },
  addButton: {
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  addressLabel: {
    fontWeight: 'bold'
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  avatarText: {
    marginTop: 6,
    color: '#888'
  }
});
