import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db } from '../firebase';
import { ref, push } from 'firebase/database';

export default function AdminUploadScreen() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async () => {
    if (!title || !price || !imageUrl) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await push(ref(db, 'products/'), {
        title,
        price,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Product uploaded successfully');
      setTitle('');
      setPrice('');
      setImageUrl('');
    } catch (err) {
      Alert.alert('Error', 'Failed to upload');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Upload Product</Text>

      <TextInput
        placeholder="Product Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Price"
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="Image URL"
        style={styles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpload}>
        <Text style={styles.buttonText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1A237E' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#1A73E8',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
