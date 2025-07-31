import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    const location = await Location.getCurrentPositionAsync({});
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

export const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode && geocode.length > 0) {
      return geocode[0]; // { city, district, name, postalCode, region, street }
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    throw error;
  }
};
