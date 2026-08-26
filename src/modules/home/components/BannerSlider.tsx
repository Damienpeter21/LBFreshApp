import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

export const BannerSlider: React.FC = () => {
  const { spacing, borderRadius, colors } = useTheme();

  const banners = [
    {
      id: 'b1',
      title: 'Mega Fresh Deals',
      subtitle: 'Up to 30% OFF on Fresh Mangoes & Berries',
      bgColor: colors.primary,
      textColor: colors.onPrimary,
      code: 'USE CODE: FRESH30',
      codeBg: colors.warning,
      codeColor: colors.onWarning,
    },
    {
      id: 'b2',
      title: 'Free Express Delivery',
      subtitle: 'Guaranteed 15 mins delivery to your doorstep',
      bgColor: colors.textPrimary,
      textColor: colors.surface,
      code: 'NO MINIMUM ORDER',
      codeBg: colors.secondary,
      codeColor: colors.onSecondary,
    },
    {
      id: 'b3',
      title: 'Organic Green Harvest',
      subtitle: '100% Pesticide Free Farm Veggies',
      bgColor: colors.secondary,
      textColor: colors.onSecondary,
      code: 'FARM FRESH',
      codeBg: colors.primary,
      codeColor: colors.onPrimary,
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
              borderRadius: borderRadius.xl,
              marginRight: spacing.md,
            },
          ]}
        >
          <Text style={[styles.bannerTitle, { color: banner.textColor }]}>{banner.title}</Text>
          <Text style={[styles.bannerSubtitle, { color: banner.textColor }]}>{banner.subtitle}</Text>
          <View style={[styles.codePill, { backgroundColor: banner.codeBg }]}>
            <Text style={[styles.codeText, { color: banner.codeColor }]}>{banner.code}</Text>
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
    width: 290,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 116,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
    lineHeight: 16,
  },
  codePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  codeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
