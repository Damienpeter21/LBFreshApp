import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Skeleton } from '../../../components';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import {
  Category,
  ProductCard,
  Product,
  mapOdooProductToProduct,
  useCart,
} from '../../products';
import { searchProducts } from '../../products/services/ProductActions';
import {
  BannerSlider,
  CategoryList,
  HomeHeader,
  HomeSkeleton,
  SearchBar,
} from '../components';
import { useFocusEffect } from '@react-navigation/native';
//API Calls
import {
  getDealoftheDay,
  getNewArrival,
  getPopularProducts,
  getProductCategoriesData,
  homeBanner,
} from '../services/HomeActions';

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 36) / 2;
const HORIZONTAL_CARD_WIDTH = 165;

interface HomeScreenProps {
  onNavigateToProductDetails: (product: Product) => void;
  onNavigateToProductList: (params?: {
    categoryId?: string;
    categoryName?: string;
    searchQuery?: string;
    products?: Product[];
    categories?: Category[];
  }) => void;
  onNavigateToCategories?: () => void;
  onNavigateToCart: () => void;
  onNavigateToProfile: () => void;
  onRequireAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToProductDetails,
  onNavigateToProductList,
  onNavigateToCategories,
  onNavigateToCart,
  onNavigateToProfile,
  onRequireAuth,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { isAuthenticated } = useAuth();
  const { totalQuantity, totalAmount } = useCart();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  //#region get data
  const [homePageData, setHomePageData] = useState<{
    productCategories: any[];
    dealoftheday: any[];
    newarrivals: any[];
    popularProducts: any[];
    banners: any[];
  }>({
    productCategories: [],
    dealoftheday: [],
    newarrivals: [],
    popularProducts: [],
    banners: [],
  });

  const getHomePageData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setPageLoading(true);
    }
    try {
      const [
        categoriesresponse,
        dealsofthedayresponse,
        newarrivalsresponse,
        popularproductsresponse,
        bannersresponse,
      ] = await Promise.all([
        getProductCategoriesData(),
        getDealoftheDay(),
        getNewArrival(),
        getPopularProducts(),
        homeBanner(),
      ]);

      setHomePageData({
        productCategories: categoriesresponse?.result || [],
        dealoftheday: dealsofthedayresponse?.result || [],
        newarrivals: newarrivalsresponse?.result || [],
        popularProducts: popularproductsresponse?.result || [],
        banners: bannersresponse?.result || [],
      });

      console.log('categoriesresponse', JSON.stringify(categoriesresponse, null, 2));
      console.log('dealsofthedayresponse', JSON.stringify(dealsofthedayresponse, null, 2));
      console.log('newarrivalsresponse', JSON.stringify(newarrivalsresponse, null, 2));
      console.log('popularproductsresponse', JSON.stringify(popularproductsresponse, null, 2));
      console.log('bannersresponse', JSON.stringify(bannersresponse, null, 2));
    } catch (error) {
      console.log('error fetching home data:', error);
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getHomePageData();
    }, [])
  );

  const onRefresh = () => {
    getHomePageData(true);
  };
  //#endregion

  // 1. Deals of the Day (Live Odoo API)
  const dealsOfTheDay = useMemo(() => {
    if (homePageData?.dealoftheday && homePageData.dealoftheday.length > 0) {
      return homePageData.dealoftheday.map(mapOdooProductToProduct);
    }
    return [] as Product[];
  }, [homePageData?.dealoftheday]);

  // 2. New Arrivals (Live Odoo API)
  const newArrivals = useMemo(() => {
    if (homePageData?.newarrivals && homePageData.newarrivals.length > 0) {
      return homePageData.newarrivals.map(mapOdooProductToProduct);
    }
    return [] as Product[];
  }, [homePageData?.newarrivals]);

  // 3. Popular Products (Live Odoo API)
  const popularProducts = useMemo(() => {
    if (homePageData?.popularProducts && homePageData.popularProducts.length > 0) {
      return homePageData.popularProducts.map(mapOdooProductToProduct);
    }
    return [] as Product[];
  }, [homePageData?.popularProducts]);

  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Debounced Live Search as user types (standard e-commerce search behavior)
  useEffect(() => {
    const trimmed = (searchQuery ?? '').trim();
    if (trimmed.length === 0) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const response = await searchProducts(trimmed);
        const products = (response?.result ?? []).map(mapOdooProductToProduct);
        setSearchResults(products);
      } catch (err) {
        console.error('Live search error:', err);
        setSearchError('Failed to load search results.');
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = async (customQuery?: string) => {
    const query = (customQuery ?? searchQuery ?? '').trim();
    if (!query) return;
    if (customQuery) {
      setSearchQuery(customQuery);
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await searchProducts(query);
      const products = (response?.result ?? []).map(mapOdooProductToProduct);
      setSearchResults(products);
      onNavigateToProductList({ products, searchQuery: query });
    } catch (e) {
      console.error('Search error:', e);
      setSearchError('Failed to search products. Please try again.');
    } finally {
      setSearchLoading(false);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Amazon/Flipkart Styled Elevated Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
          placeholder="Search for products, brands and more..."
          onSubmitEditing={() => handleSearchSubmit()}
          loading={searchLoading}
        />

        {searchError && (
          <Text style={[styles.searchErrorText, { color: colors.error }]}>{searchError}</Text>
        )}

        {/* ActionSheet / Live Search Suggestion Dropdown List */}
        {(searchQuery ?? '').trim().length > 0 && (
          <View
            style={[
              styles.searchDropdownCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
                marginHorizontal: spacing.md,
                shadowColor: colors.primary,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.searchDropdownHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.dropdownHeaderLeft}>
                <Ionicons name="search" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.dropdownHeaderTitle, { color: colors.textPrimary }]}>
                  {searchLoading
                    ? 'Searching products...'
                    : `Search Results (${searchResults.length})`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.dropdownCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content List */}
            {searchLoading ? (
              <View style={styles.searchSkeletonList}>
                {[1, 2, 3].map(i => (
                  <View key={`skel_search_${i}`} style={styles.searchSkeletonRow}>
                    <Skeleton width={44} height={44} borderRadius={borderRadius.sm} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                      <Skeleton width="40%" height={12} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.searchEmptyBox}>
                <Ionicons name="cube-outline" size={30} color={colors.textSecondary} style={{ marginBottom: 6 }} />
                <Text style={[styles.searchEmptyTitle, { color: colors.textPrimary }]}>
                  No products found
                </Text>
                <Text style={[styles.searchEmptySub, { color: colors.textSecondary }]}>
                  We couldn't find anything matching "{searchQuery.trim()}". Try another keyword.
                </Text>
              </View>
            ) : (
              <View>
                {searchResults.slice(0, 5).map((product, index) => {
                  const price = product.price ?? 0;
                  const unit = product.unit || (product as any).uom_name || '1 unit';
                  const categoryName = product.category || 'Grocery';

                  return (
                    <TouchableOpacity
                      key={`search_item_${product.id}_${index}`}
                      onPress={() => onNavigateToProductDetails(product)}
                      activeOpacity={0.75}
                      style={[
                        styles.searchResultRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth: index === Math.min(searchResults.length, 5) - 1 ? 0 : 0.5,
                        },
                      ]}
                    >
                      {/* Product Thumbnail */}
                      <View style={[styles.itemThumbBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                        {product.imageUrl ? (
                          <Image
                            source={{ uri: product.imageUrl }}
                            style={styles.itemThumbImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons name="basket-outline" size={20} color={colors.primary} />
                        )}
                      </View>

                      {/* Product Details */}
                      <View style={styles.itemInfoCol}>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <View style={styles.itemMetaRow}>
                          <View style={[styles.itemCatBadge, { backgroundColor: `${colors.primary}14` }]}>
                            <Text style={[styles.itemCatText, { color: colors.primary }]}>
                              {categoryName}
                            </Text>
                          </View>
                          <Text style={[styles.itemUnitText, { color: colors.textSecondary }]}>
                            • {unit}
                          </Text>
                        </View>
                      </View>

                      {/* Price & Forward Icon */}
                      <View style={styles.itemPriceCol}>
                        <Text style={[styles.itemPriceText, { color: colors.primary }]}>
                          ₹{price}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* View All Results Button */}
                <TouchableOpacity
                  onPress={() =>
                    onNavigateToProductList({
                      products: searchResults,
                      searchQuery: searchQuery.trim(),
                    })
                  }
                  activeOpacity={0.8}
                  style={[
                    styles.viewAllResultsBtn,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.viewAllResultsText, { color: colors.primary }]}>
                    View all {searchResults.length} results for "{searchQuery.trim()}"
                  </Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.primary} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Page Content: Skeleton or Live Data */}
        {pageLoading ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* Promotional Banner Slider */}
            {homePageData?.banners && homePageData.banners.length > 0 && (
              <BannerSlider banners={homePageData.banners} />
            )}

            {/* Categories Bar - Navigates to dedicated Category Product Listing */}
            {(homePageData?.productCategories?.length ?? 0) > 0 && (
              <CategoryList
                categories={homePageData.productCategories}
                onSelectCategory={(categoryId, categoryName) =>
                  onNavigateToProductList({ categoryId, categoryName })
                }
                onViewAllCategories={() => {
                  if (onNavigateToCategories) {
                    onNavigateToCategories();
                  } else {
                    onNavigateToProductList({ categoryId: 'all', categoryName: 'All Categories' });
                  }
                }}
              />
            )}

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
                      onNavigateToProductList({
                        categoryId: 'all',
                        categoryName: 'Deals of the Day',
                        products: dealsOfTheDay,
                      })
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
            {newArrivals.length > 0 && (
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
                      onNavigateToProductList({
                        categoryId: 'all',
                        categoryName: 'New Arrivals',
                        products: newArrivals,
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
            )}

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
                        products: popularProducts,
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
          </>
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
  searchErrorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
  },
  searchDropdownCard: {
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownCloseBtn: {
    padding: 4,
  },
  searchSkeletonList: {
    padding: 12,
  },
  searchSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchEmptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  searchEmptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  itemThumbImage: {
    width: '100%',
    height: '100%',
  },
  itemInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 4,
  },
  itemCatText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemUnitText: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemPriceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  viewAllResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  viewAllResultsText: {
    fontSize: 13,
    fontWeight: '800',
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
