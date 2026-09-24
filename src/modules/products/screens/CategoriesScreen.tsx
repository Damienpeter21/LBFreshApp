import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Skeleton } from '../../../components';
import { useTheme } from '../../../theme';
import { getProductCategoriesData } from '../../home/services/HomeActions';
import { useCart } from '../context/CartContext';
import { Category } from '../types/product';

const { width } = Dimensions.get('window');

/**
 * Maps category name to contextual icon matching project theme
 */
const getCategoryIcon = (name?: string): string => {
  const n = (name || '').toLowerCase();

  if (n.includes('fruit')) return 'nutrition-outline';
  if (n.includes('veg') || n.includes('green') || n.includes('herb') || n.includes('leaf')) return 'leaf-outline';
  if (
    n.includes('dairy') ||
    n.includes('milk') ||
    n.includes('cheese') ||
    n.includes('butter') ||
    n.includes('paneer') ||
    n.includes('curd')
  ) {
    return 'water-outline';
  }
  if (n.includes('egg')) return 'egg-outline';
  if (
    n.includes('snack') ||
    n.includes('munch') ||
    n.includes('namkeen') ||
    n.includes('chips') ||
    n.includes('biscuit') ||
    n.includes('cookie')
  ) {
    return 'fast-food-outline';
  }
  if (
    n.includes('beverag') ||
    n.includes('drink') ||
    n.includes('juice') ||
    n.includes('tea') ||
    n.includes('coffee') ||
    n.includes('soda')
  ) {
    return 'cafe-outline';
  }
  if (
    n.includes('bread') ||
    n.includes('baker') ||
    n.includes('cake') ||
    n.includes('bun') ||
    n.includes('toast')
  ) {
    return 'pizza-outline';
  }
  if (
    n.includes('sweet') ||
    n.includes('choc') ||
    n.includes('dessert') ||
    n.includes('ice cream') ||
    n.includes('mithai')
  ) {
    return 'ice-cream-outline';
  }
  if (
    n.includes('spice') ||
    n.includes('masala') ||
    n.includes('chilli') ||
    n.includes('oil') ||
    n.includes('ghee')
  ) {
    return 'flame-outline';
  }
  if (
    n.includes('rice') ||
    n.includes('atta') ||
    n.includes('flour') ||
    n.includes('dal') ||
    n.includes('pulse') ||
    n.includes('grain') ||
    n.includes('staple') ||
    n.includes('grocery')
  ) {
    return 'basket-outline';
  }
  if (
    n.includes('clean') ||
    n.includes('detergent') ||
    n.includes('wash') ||
    n.includes('house') ||
    n.includes('home')
  ) {
    return 'home-outline';
  }
  if (
    n.includes('care') ||
    n.includes('beauty') ||
    n.includes('personal') ||
    n.includes('shampoo') ||
    n.includes('soap') ||
    n.includes('skin')
  ) {
    return 'sparkles-outline';
  }
  if (n.includes('baby') || n.includes('kid')) return 'happy-outline';
  if (
    n.includes('meat') ||
    n.includes('fish') ||
    n.includes('chicken') ||
    n.includes('sea') ||
    n.includes('mutton')
  ) {
    return 'fish-outline';
  }
  if (n.includes('pet') || n.includes('dog') || n.includes('cat')) return 'paw-outline';
  if (
    n.includes('dry fruit') ||
    n.includes('nut') ||
    n.includes('seed') ||
    n.includes('badam') ||
    n.includes('cashew')
  ) {
    return 'shield-checkmark-outline';
  }
  if (
    n.includes('pooja') ||
    n.includes('festiv') ||
    n.includes('agarbatti') ||
    n.includes('camphor')
  ) {
    return 'sunny-outline';
  }
  if (
    n.includes('organic') ||
    n.includes('health') ||
    n.includes('fitness') ||
    n.includes('ayur')
  ) {
    return 'fitness-outline';
  }
  if (
    n.includes('instant') ||
    n.includes('ready') ||
    n.includes('noodle') ||
    n.includes('pasta') ||
    n.includes('soup')
  ) {
    return 'timer-outline';
  }
  if (n.includes('fresh')) return 'leaf-outline';

  return 'grid-outline';
};

interface CategoriesScreenProps {
  initialCategories?: Category[];
  onBack: () => void;
  onSelectCategory: (categoryId: string, categoryName: string) => void;
  onNavigateToCart: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  initialCategories,
  onBack,
  onSelectCategory,
  onNavigateToCart,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const { totalQuantity, totalAmount } = useCart();

  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [loading, setLoading] = useState<boolean>(!initialCategories || initialCategories.length === 0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCategories = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await getProductCategoriesData();
      if (res?.result) {
        setCategories(res.result);
      }
    } catch (err) {
      console.error('Error fetching categories in CategoriesScreen:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      fetchCategories();
    }
  }, [initialCategories]);

  // Filter categories based on search input
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => (c.name ?? '').toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const formatAmount = (val: number | string): string => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    return num.toFixed(2).replace(/\.00$/, '');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Safe Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 16),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.iconButton, { backgroundColor: colors.surfaceVariant }]}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                All Categories
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                  {categories.length}
                </Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Explore fresh farm produce & daily groceries
            </Text>
          </View>

          <TouchableOpacity
            onPress={onNavigateToCart}
            style={[styles.cartHeaderBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            accessibilityLabel="Open cart"
          >
            <Ionicons name="cart-outline" size={19} color={colors.onPrimary} />
            {totalQuantity > 0 && (
              <View
                style={[
                  styles.cartBadge,
                  { backgroundColor: colors.secondary, borderColor: colors.surface },
                ]}
              >
                <Text style={[styles.cartBadgeText, { color: colors.onSecondary }]}>
                  {totalQuantity}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Modern Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: searchQuery.length > 0 ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all categories..."
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View
              key={`cat_skel_${i}`}
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg + 2,
                },
              ]}
            >
              <Skeleton width={56} height={56} borderRadius={16} />
              <View style={styles.skeletonTextCol}>
                <Skeleton width="65%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </View>
              <Skeleton width={32} height={32} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Category Found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            We couldn't find any category matching "{searchQuery}".
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={[styles.clearSearchBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.clearSearchText, { color: colors.onPrimary }]}>Show All Categories</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `cat_${index}`)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 85, 110) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCategories(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => {
            if (!item) return null;

            const rawName = typeof item?.name === 'string' ? item.name : 'Category';
            const categoryId = String(item?.id ?? '');
            const categoryIcon = getCategoryIcon(rawName);
            const productCount = Number((item as any)?.product_count ?? 0);

            return (
              <TouchableOpacity
                onPress={() => onSelectCategory(categoryId, rawName)}
                activeOpacity={0.82}
                style={[
                  styles.horizontalCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg + 4,
                  },
                ]}
              >
                {/* Left: Brand Themed Squircle Icon Container */}
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: `${colors.primary}20`,
                    },
                  ]}
                >
                  <Ionicons name={categoryIcon} size={28} color={colors.primary} />
                </View>

                {/* Center: Category Title & Informative Subtitle */}
                <View style={styles.cardCenter}>
                  <View style={styles.cardNameRow}>
                    <Text
                      style={[styles.categoryName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {rawName}
                    </Text>
                    {productCount > 0 && (
                      <View style={[styles.countPill, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.countPillText, { color: colors.primary }]}>
                          {productCount} items
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.categorySubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    Fresh quality produce • Doorstep delivery in 15 mins
                  </Text>
                </View>

                {/* Right: Modern Action Indicator */}
                <View
                  style={[
                    styles.arrowCircle,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Cart Bar */}
      {totalQuantity > 0 && (
        <View
          style={[
            styles.floatingCart,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              bottom: Math.max(insets.bottom + 10, 16),
            },
          ]}
        >
          <View>
            <Text style={[styles.floatingCartCount, { color: colors.onPrimary }]}>
              {totalQuantity} {totalQuantity === 1 ? 'ITEM' : 'ITEMS'} • ₹{formatAmount(totalAmount)}
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  cartHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 0,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#063B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardCenter: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  categoryName: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 8,
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  categorySubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  skeletonTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  clearSearchBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  floatingCart: {
    position: 'absolute',
    left: 14,
    right: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
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
    fontSize: 13.5,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
