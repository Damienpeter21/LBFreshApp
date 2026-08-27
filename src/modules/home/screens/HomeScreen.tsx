import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useCart } from '../../cart';
import { ProductCard } from '../../products/components/ProductCard';
import { mockCategories, mockProducts } from '../../products/data/mockProducts';
import { Product } from '../../products/types/product';
import {
  BannerSlider,
  CategoryList,
  HomeHeader,
  SearchBar,
} from '../components';

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 36) / 2;
const HORIZONTAL_CARD_WIDTH = 165;

interface HomeScreenProps {
  onNavigateToProductDetails: (product: Product) => void;
  onNavigateToProductList: (params?: {
    categoryId?: string;
    categoryName?: string;
    searchQuery?: string;
  }) => void;
  onNavigateToCart: () => void;
  onNavigateToProfile: () => void;
  onRequireAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToProductDetails,
  onNavigateToProductList,
  onNavigateToCart,
  onNavigateToProfile,
  onRequireAuth,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { isAuthenticated } = useAuth();
  const { totalQuantity, totalAmount } = useCart();

  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Deals of the Day (≥20% discount)
  const dealsOfTheDay = useMemo(() => {
    return (mockProducts ?? []).filter(p => (p.discountPercentage ?? 0) >= 20).slice(0, 6);
  }, []);

  // 2. New Arrivals (first 6 newly added items)
  const newArrivals = useMemo(() => {
    return (mockProducts ?? []).slice(0, 6);
  }, []);

  // 3. Popular Products (Rating ≥ 4.8★ / Bestsellers)
  const popularProducts = useMemo(() => {
    return (mockProducts ?? [])
      .filter(p => (p.rating ?? 0) >= 4.8)
      .slice(0, 6);
  }, []);

  const handleSearchSubmit = () => {
    const query = (searchQuery ?? '').trim();
    if (query) {
      onNavigateToProductList({ searchQuery: query });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Safe Header */}
      <HomeHeader
        onPressCart={onNavigateToCart}
        onPressProfile={onNavigateToProfile}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
          placeholder="Search for products, brands and more..."
        />

        {(searchQuery ?? '').trim().length > 0 && (
          <TouchableOpacity
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
            style={[
              styles.searchBanner,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.primary,
                marginHorizontal: spacing.md,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.searchBannerText, { color: colors.primary }]}>
              Search for "{searchQuery.trim()}" in all products ›
            </Text>
          </TouchableOpacity>
        )}

        {/* Promotional Banner Slider */}
        <BannerSlider />

        {/* Categories Bar - Navigates to dedicated Category Product Listing */}
        <CategoryList
          categories={mockCategories}
          onSelectCategory={(categoryId, categoryName) =>
            onNavigateToProductList({ categoryId, categoryName })
          }
          onViewAllCategories={() =>
            onNavigateToProductList({ categoryId: 'all', categoryName: 'All Categories' })
          }
        />

        {/* 🔥 Section 1: Deals of the Day (20%+ OFF) */}
        {dealsOfTheDay.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={[styles.sectionHeaderRow, { paddingHorizontal: spacing.md }]}>
              <View style={styles.sectionTitleWithIcon}>
                <Ionicons name="flame" size={19} color={colors.warning} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Deals of the Day
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  onNavigateToProductList({ categoryId: 'all', categoryName: 'Deals of the Day' })
                }
                style={styles.seeAllBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={dealsOfTheDay}
              keyExtractor={item => `deal_${item.id}`}
              contentContainerStyle={[styles.horizontalProductsList, { paddingHorizontal: spacing.md }]}
              renderItem={({ item }) => (
                <View style={{ marginRight: 10 }}>
                  <ProductCard
                    product={item}
                    cardWidth={HORIZONTAL_CARD_WIDTH}
                    onPress={onNavigateToProductDetails}
                    onRequireAuth={!isAuthenticated ? onRequireAuth : undefined}
                  />
                </View>
              )}
            />
          </View>
        )}

        {/* 🌟 Section 2: New Arrivals */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeaderRow, { paddingHorizontal: spacing.md }]}>
            <View style={styles.sectionTitleWithIcon}>
              <Ionicons name="sparkles" size={17} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                New Arrivals
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                onNavigateToProductList({ categoryId: 'all', categoryName: 'New Arrivals' })
              }
              style={styles.seeAllBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.productGrid}>
            {newArrivals.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                cardWidth={GRID_CARD_WIDTH}
                onPress={onNavigateToProductDetails}
                onRequireAuth={!isAuthenticated ? onRequireAuth : undefined}
              />
            ))}
          </View>
        </View>

        {/* 🏆 Section 3: Popular Products (Top Rated) */}
        {popularProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={[styles.sectionHeaderRow, { paddingHorizontal: spacing.md }]}>
              <View style={styles.sectionTitleWithIcon}>
                <Ionicons name="trending-up" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Popular Products
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  onNavigateToProductList({
                    categoryId: 'all',
                    categoryName: 'Popular Products',
                  })
                }
                style={styles.seeAllBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.productGrid}>
              {popularProducts.map(item => (
                <ProductCard
                  key={`pop_${item.id}`}
                  product={item}
                  cardWidth={GRID_CARD_WIDTH}
                  onPress={onNavigateToProductDetails}
                  onRequireAuth={!isAuthenticated ? onRequireAuth : undefined}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Cart Bar with Safe Insets */}
      {totalQuantity > 0 && (
        <View
          style={[
            styles.floatingCart,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              bottom: Math.max(insets.bottom + 8, 16),
            },
          ]}
        >
          <View>
            <Text style={[styles.floatingCartCount, { color: colors.onPrimary }]}>
              {totalQuantity} {totalQuantity === 1 ? 'ITEM' : 'ITEMS'} • ₹{totalAmount}
            </Text>
            <Text style={[styles.floatingCartSub, { color: colors.onPrimary }]}>
              Extra savings applied at checkout!
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateToCart}
            style={styles.viewCartButton}
          >
            <Text style={[styles.viewCartText, { color: colors.onPrimary }]}>View Cart</Text>
            <Ionicons name="cart" size={16} color={colors.onPrimary} style={{ marginLeft: 6 }} />
            <Ionicons name="chevron-forward" size={14} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  searchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionContainer: {
    marginTop: 14,
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginRight: 2,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  horizontalProductsList: {
    paddingVertical: 4,
  },
  floatingCart: {
    position: 'absolute',
    left: 14,
    right: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingCartCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  floatingCartSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    opacity: 0.9,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
