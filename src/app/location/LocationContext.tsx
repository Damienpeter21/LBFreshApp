import React, { createContext, useContext, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { API_SETTINGS } from '../config';
import { reverseGeocodeCoordinates } from './geocodingService';
import { LocationCoordinates, UserLocation } from './types';

interface LocationContextType {
  location: UserLocation;
  fetchLiveGpsLocation: () => Promise<void>;
  setManualLocation: (shortAddress: string, fullAddress: string) => void;
  isPickerVisible: boolean;
  openLocationPicker: () => void;
  closeLocationPicker: () => void;
}

const DEFAULT_LOCATION: UserLocation = {
  shortAddress: `Anna Salai, ${API_SETTINGS.defaultCity}`,
  formattedAddress: `Anna Salai, Central, ${API_SETTINGS.defaultCity}, ${API_SETTINGS.defaultState} ${API_SETTINGS.defaultPostalCode}`,
  locality: 'Anna Salai',
  city: API_SETTINGS.defaultCity,
  state: API_SETTINGS.defaultState,
  postalCode: API_SETTINGS.defaultPostalCode,
  coordinates: API_SETTINGS.defaultCoordinates,
  isLiveGps: false,
  isLoading: false,
  error: null,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);

  const requestAndroidPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'LBFresh needs your GPS location to show accurate delivery times and fresh store items.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow GPS',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission request error:', err);
      return false;
    }
  };

  const fetchLiveGpsLocation = async (): Promise<void> => {
    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    const hasPermission = await requestAndroidPermission();
    if (!hasPermission) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: 'Location permission denied. Using default address.',
      }));
      return;
    }

    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });

    Geolocation.getCurrentPosition(
      async position => {
        const coords: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const geocoded = await reverseGeocodeCoordinates(coords);

        setLocation({
          formattedAddress: geocoded.formattedAddress || 'Live GPS Location',
          shortAddress: geocoded.shortAddress || 'Current GPS Location',
          locality: geocoded.subLocality || geocoded.locality,
          city: geocoded.city,
          state: geocoded.state,
          postalCode: geocoded.postalCode,
          coordinates: coords,
          isLiveGps: true,
          isLoading: false,
          error: null,
        });
      },
      error => {
        console.log('GPS error:', error.message);
        setLocation(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Unable to retrieve GPS position.',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const setManualLocation = (shortAddress: string, fullAddress: string) => {
    setLocation(prev => ({
      ...prev,
      shortAddress,
      formattedAddress: fullAddress,
      isLiveGps: false,
      isLoading: false,
      error: null,
    }));
    setIsPickerVisible(false);
  };

  useEffect(() => {
    fetchLiveGpsLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        fetchLiveGpsLocation,
        setManualLocation,
        isPickerVisible,
        openLocationPicker: () => setIsPickerVisible(true),
        closeLocationPicker: () => setIsPickerVisible(false),
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
