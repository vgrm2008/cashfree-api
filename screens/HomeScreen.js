import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const staticServices = [
  { name: 'AC Repair', icon: require('../assets/ac-repair.png'), price: 499 },
  { name: 'AC Installation', icon: require('../assets/ac-install.png'), price: 799 },
  { name: 'AC Servicing', icon: require('../assets/gas-refill.png'), price: 599 },
  { name: 'Electrician', icon: require('../assets/electrician.png'), price: 199 },
];

const banners = [
  require('../assets/banner1.png'),
  require('../assets/banner2.png'),
  require('../assets/banner3.png'),
];

const testimonials = [
  { name: 'Rahul S.', feedback: 'Very professional and quick service!' },
  { name: 'Neha M.', feedback: 'Booking was easy, and technician was polite.' },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [dynamicServices, setDynamicServices] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const servicesRef = ref(db, 'services');
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.values(data).filter(service => service.visible !== false);
      setDynamicServices(list);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadProfile = async () => {
        const storedMobile = await AsyncStorage.getItem('userMobile');
        if (storedMobile) {
          setMobile(storedMobile);
          const userRef = ref(db, `users/${storedMobile}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setName(data.name || '');
            if (data.profileImage) setProfileImage(data.profileImage);
          }
        }
      };
      loadProfile();
    }, [])
  );

  const handleServicePress = (serviceName) => {
    navigation.navigate('Book Service', {
      screen: 'SubServices',
      params: { service: serviceName },
    });
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/918851543700');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('userMobile');
            navigation.reset({
              index: 0,
              routes: [{ name: 'CustomerLogin' }],
            });
          },
        },
      ]
    );
  };

  const onScroll = (event) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== currentBannerIndex) {
      setCurrentBannerIndex(slide);
    }
  };

  const renderServiceCard = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => handleServicePress(item.name)}
    >
      <Image source={{ uri: item.icon }} style={styles.icon} />
      <Text style={styles.cardText}>{item.name}</Text>
      <Text style={styles.priceText}>Starts at ₹{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.offerBox}>
          <Text style={styles.offerText}>🎉 ₹100 OFF on 1st AC Service!</Text>
        </View>

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>Welcome{ name ? `, ${name}` : `, ${mobile}` } 👋</Text>
            <Text style={styles.subText}>Your Comfort, Our Mission!</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#007bff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require('../assets/default-avatar.png')
              }
              style={styles.profilePic}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ref={scrollRef}
          style={{ marginTop: 10 }}
        >
          {banners.map((img, index) => (
            <Image
              key={index}
              source={img}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View style={styles.dotsContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentBannerIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        <Text style={styles.title}>Our Services</Text>
        <View style={styles.serviceGrid}>
          {staticServices.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleServicePress(item.name)}
            >
              <Image source={item.icon} style={styles.icon} />
              <Text style={styles.cardText}>{item.name}</Text>
              <Text style={styles.priceText}>Starts at ₹{item.price}</Text>
            </TouchableOpacity>
          ))}
          {dynamicServices.map((item, index) => renderServiceCard(item, index))}
        </View>

        <Image
          source={require('../assets/promo-banner.png')}
          style={styles.banner}
          resizeMode="cover"
        />

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Daily Tip</Text>
          <Text style={styles.tipText}>
            Clean your AC filter every month for best cooling and electricity savings!
          </Text>
        </View>

        <Text style={styles.title}>Customer Reviews</Text>
        {testimonials.map((t, i) => (
          <View key={i} style={styles.testimonialBox}>
            <Text style={styles.testimonialName}>{t.name}</Text>
            <Text style={styles.testimonialText}>“{t.feedback}”</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>💬 WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12 },
  offerBox: {
    backgroundColor: '#ff9800',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginVertical: 6,
    paddingHorizontal: 20,
  },
  offerText: { color: '#fff', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcome: { fontSize: 20, fontWeight: 'bold' },
  subText: { fontSize: 13, color: '#666' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
  },
  logoutText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#007bff',
    fontWeight: '600',
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  carouselImage: {
    width: width - 24,
    height: 150,
    borderRadius: 12,
    marginRight: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    margin: 4,
  },
  activeDot: {
    backgroundColor: '#007bff',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#f2f2f2',
    marginVertical: 6,
    width: '48%',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  icon: { width: 50, height: 50, marginBottom: 10 },
  cardText: { fontSize: 14, fontWeight: '600', color: '#333' },
  priceText: { fontSize: 13, color: '#777', marginTop: 4 },
  banner: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    marginVertical: 10,
  },
  tipBox: {
    backgroundColor: '#e0f7fa',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  tipTitle: { fontWeight: 'bold', fontSize: 15 },
  tipText: { marginTop: 4, fontSize: 13, color: '#333' },
  testimonialBox: {
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  testimonialName: { fontWeight: 'bold', fontSize: 14 },
  testimonialText: { fontStyle: 'italic', fontSize: 13, color: '#555' },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  whatsappBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 4,
  },
});
