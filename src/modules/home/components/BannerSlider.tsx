import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';

export interface BannerSliderProps {
  banners?: any[];
}

export interface BannerItem {
  id: string | number;
  title: string;
  subtitle: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
  code: string;
  codeBg: string;
  codeColor: string;
  iconName: string;
}

const BANNER_THEMES = [
  {
    darkBg: '#144A24',
    lightBg: '#0F381B',
    border: '#1E6B34',
    codeBg: '#EAB308',
    codeColor: '#0F2604',
    icon: 'leaf',
  },
  {
    darkBg: '#134758',
    lightBg: '#0E3643',
    border: '#1D6880',
    codeBg: '#38BDF8',
    codeColor: '#08253B',
    icon: 'basket',
  },
  {
    darkBg: '#4E161D',
    lightBg: '#3B1015',
    border: '#7D232F',
    codeBg: '#EF4444',
    codeColor: '#FFFFFF',
    icon: 'flash',
  },
  {
    darkBg: '#3E1F5A',
    lightBg: '#2C1541',
    border: '#6B389B',
    codeBg: '#C084FC',
    codeColor: '#280A45',
    icon: 'gift',
  },
  {
    darkBg: '#5A3816',
    lightBg: '#3D240E',
    border: '#8E5A26',
    codeBg: '#F59E0B',
    codeColor: '#301804',
    icon: 'pricetag',
  },
];

export const mapLoyaltyProgramToBanner = (
  item: any,
  index: number,
  isDark: boolean,
): BannerItem => {
  const theme = BANNER_THEMES[index % BANNER_THEMES.length];
  const title = String(item.name || 'Special Offer');

  let subtitle = 'Exclusive discount and reward benefits on fresh groceries';
  if (item.program_type === 'buy_x_get_y') {
    subtitle = 'Buy eligible items and get rewarded instantly!';
  } else if (item.program_type === 'promo_code') {
    subtitle = item.date_to
      ? `Promo code offer valid till ${item.date_to}`
      : 'Use promo code at checkout for extra savings!';
  } else if (item.program_type === 'promotion') {
    subtitle = item.date_to
      ? `Special promotion active till ${item.date_to}`
      : 'Limited time promotional savings on select products';
  } else if (item.program_type === 'gift_card') {
    subtitle = 'Gift cards available for your fresh grocery orders';
  }

  let code = 'SPECIAL OFFER';
  if (item.trigger === 'with_code') {
    code = 'USE PROMO CODE';
  } else if (item.program_type === 'buy_x_get_y') {
    code = 'BOGO DEAL';
  } else if (item.program_type === 'gift_card') {
    code = 'GIFT REWARD';
  } else if (item.trigger === 'auto') {
    code = 'AUTO APPLIED';
  }

  return {
    id: item.id ?? `banner_${index}`,
    title,
    subtitle,
    bgColor: isDark ? theme.lightBg : theme.darkBg,
    borderColor: theme.border,
    textColor: '#FFFFFF',
    subTextColor: 'rgba(255, 255, 255, 0.9)',
    code,
    codeBg: theme.codeBg,
    codeColor: theme.codeColor,
    iconName: theme.icon,
  };
};

export const BannerSlider: React.FC<BannerSliderProps> = ({ banners: apiBanners }) => {
  const { spacing, borderRadius, isDark } = useTheme();

  const fallbackBanners: BannerItem[] = useMemo(
    () => [
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
    ],
    [isDark],
  );

  const displayBanners = useMemo(() => {
    if (apiBanners && apiBanners.length > 0) {
      return apiBanners.map((item, index) =>
        mapLoyaltyProgramToBanner(item, index, isDark),
      );
    }
    return fallbackBanners;
  }, [apiBanners, fallbackBanners, isDark]);

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: spacing.md }]}
    >
      {displayBanners.map(banner => (
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
          {/* Decorative Backdrop Icon */}
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
export default BannerSlider;
