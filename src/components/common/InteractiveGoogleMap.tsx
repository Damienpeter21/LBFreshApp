import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_SETTINGS, GOOGLE_SETTINGS } from '../../app/config';
import { useTheme } from '../../theme';

let WebViewComponent: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webviewModule = require('react-native-webview');
  WebViewComponent = webviewModule.WebView;
} catch (e) {
  WebViewComponent = null;
}

const isWebViewNativeReady = (): boolean => {
  if (!WebViewComponent) return false;
  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const hasConfig =
        UIManager.hasViewManagerConfig &&
        (UIManager.hasViewManagerConfig('RNCWebView') ||
          UIManager.hasViewManagerConfig('RTCWebView'));
      const getConfig =
        UIManager.getViewManagerConfig &&
        (UIManager.getViewManagerConfig('RNCWebView') ||
          UIManager.getViewManagerConfig('RTCWebView'));
      return Boolean(hasConfig || getConfig);
    }
    return true;
  } catch {
    return false;
  }
};

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
  subtitle?: string;
}

export interface InteractiveGoogleMapRef {
  recenter: (lat?: number, lon?: number) => void;
  setMapType: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => void;
  searchAddress: (query: string) => void;
  setCenter: (lat: number, lon: number, zoom?: number) => void;
}

export interface InteractiveGoogleMapProps {
  mode?: 'picker' | 'preview';
  initialLocation?: MapCoordinates;
  initialZoom?: number;
  showControls?: boolean;
  showPin?: boolean;
  interactive?: boolean;
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
}

export const InteractiveGoogleMap = React.forwardRef<
  InteractiveGoogleMapRef,
  InteractiveGoogleMapProps
>(
  (
    {
      mode = 'picker',
      initialLocation,
      initialZoom = 16,
      showControls = true,
      showPin = true,
      interactive = true,
      onLocationSelect,
      height = '100%',
      style,
    },
    ref
  ) => {
    const { colors, isDark } = useTheme();

    const [currentLat, setCurrentLat] = useState<number>(
      initialLocation?.latitude || 13.0827
    );
    const [currentLon, setCurrentLon] = useState<number>(
      initialLocation?.longitude || 80.2707
    );
    const [zoom, setZoom] = useState<number>(initialZoom);
    const [mapType, setMapTypeState] = useState<'roadmap' | 'satellite'>('roadmap');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [webViewError, setWebViewError] = useState<boolean>(false);

    const webViewRef = useRef<any>(null);
    const zoomRef = useRef<number>(zoom);
    zoomRef.current = zoom;
    const centerRef = useRef<{ latitude: number; longitude: number }>({
      latitude: currentLat,
      longitude: currentLon,
    });
    centerRef.current = { latitude: currentLat, longitude: currentLon };

    // Google API Key with fallback
    const googleApiKey = (
      (API_SETTINGS as any).googleMap?.key ||
      GOOGLE_SETTINGS.mapsApiKey ||
      'AIzaSyDfNOU_zv2QAESamCNM8UM8M1FyAXXORZc'
    )
      .trim()
      .replace(/\.+$/, '');

    // Synchronize props when initialLocation changes
    useEffect(() => {
      if (initialLocation?.latitude && initialLocation?.longitude) {
        setCurrentLat(initialLocation.latitude);
        setCurrentLon(initialLocation.longitude);
      }
    }, [initialLocation?.latitude, initialLocation?.longitude]);

    // Imperative ref methods
    useImperativeHandle(ref, () => ({
      recenter: (lat?: number, lon?: number) => {
        const targetLat = lat ?? initialLocation?.latitude ?? 13.0827;
        const targetLon = lon ?? initialLocation?.longitude ?? 80.2707;
        setCurrentLat(targetLat);
        setCurrentLon(targetLon);
        setZoom(16);

        if (webViewRef.current && isWebViewNativeReady() && !webViewError) {
          webViewRef.current.injectJavaScript(`
            if (window.setCenterLocation) {
              window.setCenterLocation(${targetLat}, ${targetLon}, 16);
            }
            true;
          `);
        }
      },
      setMapType: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
        const gType = type === 'satellite' ? 'satellite' : 'roadmap';
        setMapTypeState(gType);
        if (webViewRef.current && isWebViewNativeReady() && !webViewError) {
          webViewRef.current.injectJavaScript(`
            if (window.googleMap) {
              window.googleMap.setMapTypeId('${gType}');
            }
            true;
          `);
        }
      },
      searchAddress: (query: string) => {
        if (!query.trim()) return;
        if (webViewRef.current && isWebViewNativeReady() && !webViewError) {
          webViewRef.current.injectJavaScript(`
            if (window.searchAndPinLocation) {
              window.searchAndPinLocation(${JSON.stringify(query)});
            }
            true;
          `);
        }
      },
      setCenter: (lat: number, lon: number, newZoom?: number) => {
        setCurrentLat(lat);
        setCurrentLon(lon);
        if (newZoom) setZoom(newZoom);
        if (webViewRef.current && isWebViewNativeReady() && !webViewError) {
          webViewRef.current.injectJavaScript(`
            if (window.setCenterLocation) {
              window.setCenterLocation(${lat}, ${lon}, ${newZoom || zoomRef.current});
            }
            true;
          `);
        }
      },
    }));

    // Generate HTML for WebView with Google Maps JavaScript API
    const webViewHtml = useMemo(() => {
      const lat = currentLat;
      const lon = currentLon;
      const primaryColor = colors.primary || '#16a34a';

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Google Maps Delivery Pin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background-color: ${isDark ? '#0f172a' : '#f1f5f9'}; }
    .custom-pin-marker {
      width: 44px;
      height: 44px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      pointer-events: none;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .pin-body {
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      background: ${primaryColor};
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      border: 3px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-inner {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #FFFFFF;
      transform: rotate(45deg);
    }
    .pin-shadow {
      width: 14px;
      height: 6px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
      margin-top: 2px;
    }
    .center-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
  </style>
  <script src="https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,geometry"></script>
</head>
<body>
  <div id="map"></div>
  ${
    showPin
      ? `<div class="center-overlay">
          <div class="custom-pin-marker">
            <div class="pin-body">
              <div class="pin-inner"></div>
            </div>
            <div class="pin-shadow"></div>
          </div>
        </div>`
      : ''
  }

  <script>
    var googleMap;
    var geocoder;
    var isUserInteracting = false;
    var idleTimeout = null;

    function initMap() {
      try {
        var startLat = ${lat};
        var startLng = ${lon};
        var mapOptions = {
          center: { lat: startLat, lng: startLng },
          zoom: ${zoom},
          mapTypeId: '${mapType}',
          disableDefaultUI: true,
          gestureHandling: '${interactive ? 'greedy' : 'none'}',
          clickableIcons: false,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: ${
            isDark
              ? JSON.stringify([
                  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                  {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{ color: '#38414e' }],
                  },
                  {
                    featureType: 'road',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#212a37' }],
                  },
                  {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#17263c' }],
                  },
                ])
              : '[]'
          }
        };

        googleMap = new google.maps.Map(document.getElementById('map'), mapOptions);
        geocoder = new google.maps.Geocoder();

        // Map drag and center change listeners
        googleMap.addListener('dragstart', function() {
          isUserInteracting = true;
        });

        googleMap.addListener('dragend', function() {
          isUserInteracting = false;
          notifyCenter();
        });

        // Click / tap on map to pan and pinpoint
        googleMap.addListener('click', function(e) {
          if (e && e.latLng) {
            googleMap.panTo(e.latLng);
            notifyLocation(e.latLng.lat(), e.latLng.lng(), 'tap');
          }
        });

        // Idle event fires when zooming or dragging completes
        googleMap.addListener('idle', function() {
          if (idleTimeout) clearTimeout(idleTimeout);
          idleTimeout = setTimeout(function() {
            notifyCenter();
          }, 350);
        });

        // Post initialization success
        sendRN({ type: 'ready', latitude: startLat, longitude: startLng });
      } catch (err) {
        sendRN({ type: 'error', message: err.toString() });
      }
    }

    function notifyCenter() {
      if (!googleMap) return;
      var c = googleMap.getCenter();
      if (c) {
        notifyLocation(c.lat(), c.lng(), 'drag');
      }
    }

    function notifyLocation(lat, lng, action) {
      if (!geocoder) {
        sendRN({ type: 'location_changed', latitude: lat, longitude: lng, action: action });
        return;
      }

      geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
        var address = '';
        if (status === 'OK' && results && results[0]) {
          address = results[0].formatted_address;
        }
        sendRN({
          type: 'location_changed',
          latitude: lat,
          longitude: lng,
          address: address,
          action: action
        });
      });
    }

    window.setCenterLocation = function(lat, lng, newZoom) {
      if (googleMap) {
        googleMap.panTo({ lat: lat, lng: lng });
        if (newZoom) googleMap.setZoom(newZoom);
      }
    };

    window.searchAndPinLocation = function(query) {
      if (!geocoder || !query) return;
      geocoder.geocode({ address: query }, function(results, status) {
        if (status === 'OK' && results && results[0]) {
          var loc = results[0].geometry.location;
          googleMap.setCenter(loc);
          googleMap.setZoom(17);
          sendRN({
            type: 'location_changed',
            latitude: loc.lat(),
            longitude: loc.lng(),
            address: results[0].formatted_address,
            action: 'search'
          });
        } else {
          sendRN({ type: 'search_error', query: query });
        }
      });
    };

    function sendRN(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    window.onload = initMap;
  </script>
</body>
</html>`;
    }, [currentLat, currentLon, zoom, mapType, colors.primary, isDark, showPin, interactive, googleApiKey]);

    // Handle incoming messages from WebView
    const handleWebViewMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'ready') {
          setIsLoading(false);
        } else if (data.type === 'location_changed') {
          setCurrentLat(data.latitude);
          setCurrentLon(data.longitude);
          if (onLocationSelect) {
            onLocationSelect({
              latitude: data.latitude,
              longitude: data.longitude,
              address: data.address,
            });
          }
        } else if (data.type === 'error') {
          console.warn('Google Map WebView error:', data.message);
          setWebViewError(true);
        }
      } catch (e) {
        console.warn('Error parsing map message:', e);
      }
    };

    // ── FALLBACK CANVAS WITH PAN & PINCH GESTURES (Mercator Projection) ──
    const mapPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const isPinching = useRef<boolean>(false);
    const initialPinchDist = useRef<number | null>(null);
    const panStartCenter = useRef<{ latitude: number; longitude: number }>({
      latitude: currentLat,
      longitude: currentLon,
    });

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          return interactive && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3);
        },
        onPanResponderGrant: () => {
          panStartCenter.current = {
            latitude: centerRef.current.latitude,
            longitude: centerRef.current.longitude,
          };
          mapPan.setValue({ x: 0, y: 0 });
          isPinching.current = false;
          initialPinchDist.current = null;
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          if (touches && touches.length >= 2) {
            // Two-finger pinch-to-zoom
            isPinching.current = true;
            const [t1, t2] = touches;
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            if (!initialPinchDist.current) {
              initialPinchDist.current = dist;
            } else {
              const diff = dist - initialPinchDist.current;
              if (diff > 35) {
                setZoom(prev => Math.min(prev + 1, 20));
                initialPinchDist.current = dist;
              } else if (diff < -35) {
                setZoom(prev => Math.max(prev - 1, 10));
                initialPinchDist.current = dist;
              }
            }
          } else if (!isPinching.current) {
            // Smooth single-finger translation
            mapPan.setValue({ x: gestureState.dx, y: gestureState.dy });
          }
        },
        onPanResponderRelease: (_evt, gestureState) => {
          if (isPinching.current) {
            isPinching.current = false;
            initialPinchDist.current = null;
            Animated.spring(mapPan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              friction: 8,
            }).start();
            return;
          }

          const distMoved = Math.hypot(gestureState.dx, gestureState.dy);
          if (distMoved > 5) {
            // Standard Web Mercator Projection formula
            const currentZoom = zoomRef.current;
            const startLat = panStartCenter.current.latitude;
            const startLon = panStartCenter.current.longitude;

            const degLonPerPixel = (360 / (256 * Math.pow(2, currentZoom))) * 0.75;
            const degLatPerPixel = degLonPerPixel * Math.cos((startLat * Math.PI) / 180);

            const deltaLon = -gestureState.dx * degLonPerPixel;
            const deltaLat = gestureState.dy * degLatPerPixel;

            const newLat = Number((startLat + deltaLat).toFixed(6));
            const newLon = Number((startLon + deltaLon).toFixed(6));

            setCurrentLat(newLat);
            setCurrentLon(newLon);
            if (onLocationSelect) {
              onLocationSelect({
                latitude: newLat,
                longitude: newLon,
              });
            }
          }

          mapPan.setValue({ x: 0, y: 0 });
          initialPinchDist.current = null;
          isPinching.current = false;
        },
        onPanResponderTerminate: () => {
          mapPan.setValue({ x: 0, y: 0 });
          initialPinchDist.current = null;
          isPinching.current = false;
        },
      })
    ).current;

    const staticMapUri = useMemo(() => {
      const lat = currentLat;
      const lon = currentLon;
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=640x360&scale=2&maptype=${mapType}&format=png&visual_refresh=true&key=${googleApiKey}`;
    }, [currentLat, currentLon, zoom, mapType, googleApiKey]);

    const handleZoomIn = useCallback(() => {
      setZoom(prev => Math.min(prev + 1, 19));
      if (webViewRef.current && isWebViewNativeReady() && !webViewError) {
        webViewRef.current.injectJavaScript(`
          if (window.googleMap) {
            window.googleMap.setZoom(window.googleMap.getZoom() + 1);
          }
          true;
        `);
      }
    }, [webViewError]);

    const handleZoomOut = useCallback(() => {
      setZoom(prev => Math.max(prev - 1, 10));
      if (webViewRef.current && isWebViewNativeReady() && !webViewError) {
        webViewRef.current.injectJavaScript(`
          if (window.googleMap) {
            window.googleMap.setZoom(window.googleMap.getZoom() - 1);
          }
          true;
        `);
      }
    }, [webViewError]);

    const canUseWebView = isWebViewNativeReady() && !webViewError && WebViewComponent;

    return (
      <View style={[styles.container, { height }, style]}>
        {canUseWebView ? (
          <View style={StyleSheet.absoluteFill}>
            <WebViewComponent
              ref={webViewRef}
              source={{ html: webViewHtml }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              geolocationEnabled={true}
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              onMessage={handleWebViewMessage}
              onError={() => setWebViewError(true)}
              onHttpError={() => setWebViewError(true)}
              style={styles.webView}
            />

            {isLoading && (
              <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
                  Loading Interactive Google Map...
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Gesture-Driven Interactive Canvas Fallback */
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            <Animated.Image
              key={staticMapUri}
              source={{ uri: staticMapUri }}
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    { translateX: mapPan.x },
                    { translateY: mapPan.y },
                  ],
                },
              ]}
              resizeMode="cover"
            />

            {/* Centered Pin Indicator */}
            {showPin && (
              <View pointerEvents="none" style={styles.centerPinContainer}>
                <View style={[styles.pinPulseRing, { backgroundColor: `${colors.primary}30` }]} />
                <View style={[styles.pinCircle, { backgroundColor: colors.primary }]}>
                  <Ionicons name="location" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.pinShadow} />
              </View>
            )}
          </View>
        )}

        {/* Floating Zoom Controls (+ / -) */}
        {showControls && (
          <View
            style={[
              styles.floatingControls,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleZoomIn}
              style={styles.controlBtn}
            >
              <Ionicons name="add" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleZoomOut}
              style={styles.controlBtn}
            >
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

InteractiveGoogleMap.displayName = 'InteractiveGoogleMap';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  centerPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 10,
  },
  pinPulseRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
  },
  pinShadow: {
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    marginTop: -8,
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 24,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlDivider: {
    height: 1,
    width: '100%',
  },
});
