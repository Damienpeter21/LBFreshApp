import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';

export const BannerSlider: React.FC = () => {
  const { spacing, borderRadius, isDark } = useTheme();

  const banners = [
    {
      id: 'b1',
      title: 'Mega Fresh Super Sale',
      subtitle: 'Up to 30% OFF on Farm Fresh Produce & Fruits',
      bgColor: isDark ? '#17361E' : '#144A24',
      borderColor: isDark ? '#2E633A' : '#1E6B34',
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.88)',
      code: 'USE CODE: FRESH30',
      codeBg: '#EAB308',
      codeColor: '#0F2604',
      iconName: 'leaf',
    },
    {
      id: 'b2',
      title: 'Pantry & Organic Staples',
      subtitle: 'Up to 25% OFF on Cold-Pressed Oils & Basmati Rice',
      bgColor: isDark ? '#182E38' : '#134758',
      borderColor: isDark ? '#2A4E5E' : '#1D6880',
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.88)',
      code: 'PANTRY FEST',
      codeBg: '#38BDF8',
      codeColor: '#08253B',
      iconName: 'basket',
    },
    {
      id: 'b3',
      title: 'Free Express Delivery',
      subtitle: 'Guaranteed 15 mins delivery on all grocery orders',
      bgColor: isDark ? '#38161B' : '#4E161D',
      borderColor: isDark ? '#63252E' : '#7D232F',
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.88)',
      code: 'NO MINIMUM ORDER',
      codeBg: '#EF4444',
      codeColor: '#FFFFFF',
      iconName: 'flash',
    },
  ];

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: spacing.md }]}
    >
      {banners.map(banner => (
        <View
          key={banner.id}
          style={[
            styles.bannerCard,
            {
              backgroundColor: banner.bgColor,
              borderColor: banner.borderColor,
              borderRadius: borderRadius.xl,
              marginRight: spacing.md,
            },
          ]}
        >
          {/* Subtle Decorative Backdrop Icon */}
          <View style={styles.decorativeIconBox}>
            <Ionicons
              name={banner.iconName}
              size={84}
              color="rgba(255, 255, 255, 0.08)"
            />
          </View>

          <View style={styles.contentColumn}>
            <Text style={[styles.bannerTitle, { color: banner.textColor }]}>
              {banner.title}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: banner.subTextColor }]}>
              {banner.subtitle}
            </Text>

            <View style={[styles.codePill, { backgroundColor: banner.codeBg }]}>
              <Text style={[styles.codeText, { color: banner.codeColor }]}>
                {banner.code}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  bannerCard: {
    width: 300,
    padding: 18,
    borderWidth: 1,
    minHeight: 124,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  decorativeIconBox: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  contentColumn: {
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  codePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 12,
  },
  codeText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
