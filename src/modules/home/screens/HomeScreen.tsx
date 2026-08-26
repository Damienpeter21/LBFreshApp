import React, { useMemo, useState } from 'react';
import {
  FlatList,
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

interface HomeScreenProps {
  onNavigateToProductDetails: (product: Product) => void;
  onNavigateToCart: () => void;
  onNavigateToProfile: () => void;
  onRequireAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToProductDetails,
  onNavigateToCart,
  onNavigateToProfile,
  onRequireAuth,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius } = useTheme();
  const { isAuthenticated } = useAuth();
  const { totalQuantity, totalAmount } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(p => {
      const matchesCategory =
        selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Safe Header */}
      <HomeHeader
        onPressCart={onNavigateToCart}
        onPressProfile={onNavigateToProfile}
      />

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Banner Carousel */}
            <BannerSlider />

            {/* Categories */}
            <CategoryList
              categories={mockCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Product Section Title */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {selectedCategory === 'all'
                    ? 'Fresh Arrivals (15 Mins Delivery)'
                    : `${selectedCategory.toUpperCase()} Catalog`}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={onNavigateToProductDetails}
            onRequireAuth={!isAuthenticated ? onRequireAuth : undefined}
          />
        )}
      />

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
  columnWrapper: {
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  listContent: {
    paddingTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
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
