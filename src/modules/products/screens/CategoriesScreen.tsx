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
const CARD_WIDTH = (width - 36) / 2;

// Subtle accent color palette for card highlights
const ACCENT_COLORS = [
  '#00875A', // Forest Green (Primary)
  '#E65100', // Orange Amber
  '#1565C0', // Blue
  '#6A1B9A', // Purple
  '#00695C', // Teal
  '#AD1457', // Pink/Rose
  '#D84315', // Rust
  '#283593', // Indigo
];

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
  const { colors, spacing, borderRadius } = useTheme();
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
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              All Categories
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {loading ? 'Loading...' : `${categories.length} categories`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onNavigateToCart}
            style={[styles.cartHeaderBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
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
          <Ionicons name="search-outline" size={17} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories..."
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <View
              key={`cat_skel_${i}`}
              style={[
                styles.cardSkeleton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Skeleton width="40%" height={10} borderRadius={3} style={{ marginBottom: 10 }} />
              <Skeleton width="85%" height={16} borderRadius={4} style={{ marginBottom: 16 }} />
              <Skeleton width="50%" height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Category Found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            No categories matching "{searchQuery}".
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
          keyExtractor={(item, index) => item?.id ? String(item.id) : `cat_${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 80, 100) },
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
            const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

            // item.name from Odoo = clean leaf name e.g. "Fruits", "Beverages"
            const rawName = typeof item?.name === 'string' ? item.name : 'Category';

            // ── Badge Resolution (3-tier priority) ───────────────────────────
            // Tier 1: parent_id from API → [id, "Parent Name"] or false
            const rawParentId = (item as any)?.parent_id;
            const parentIdName: string | null =
              Array.isArray(rawParentId) && rawParentId[1]
                ? String(rawParentId[1])
                : null;

            // Tier 2: If parent_id is false or "All", parse complete_name from API
            // complete_name = "All / Grocery / Fruits" → extract "Grocery"
            let badgeLabel: string | null = null;

            if (parentIdName && parentIdName.toLowerCase() !== 'all') {
              // Tier 1: Real parent name directly from API
              badgeLabel = parentIdName;
            } else {
              // Tier 2: Derive from complete_name (API field, not hardcoded)
              const completeName = typeof (item as any)?.complete_name === 'string'
                ? (item as any).complete_name
                : null;
              if (completeName) {
                const segments = completeName
                  .split('/')
                  .map((s: string) => s.trim())
                  .filter(Boolean);
                // Strip Odoo root "All" prefix, then take the second-to-last segment
                // e.g. ["All","Grocery","Fruits"] → strip "All" → ["Grocery","Fruits"] → "Grocery"
                const meaningful = segments[0]?.toLowerCase() === 'all'
                  ? segments.slice(1)
                  : segments;
                // Only show parent segment if it's different from the leaf name itself
                if (meaningful.length > 1) {
                  badgeLabel = meaningful[meaningful.length - 2] ?? null;
                }
                // meaningful.length === 1 → it IS the leaf → no badge (avoid redundancy)
              }
            }
            // Tier 3: badgeLabel is null → badge hidden entirely (no local fallback strings)

            const categoryId = String(item?.id ?? '');

            return (
              <TouchableOpacity
                onPress={() => onSelectCategory(categoryId, rawName)}
                activeOpacity={0.75}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md + 2,
                    shadowColor: accentColor,
                  },
                ]}
              >
                {/* Parent Badge — only rendered when API resolves a real parent label */}
                {badgeLabel !== null && (
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.accentPill, { backgroundColor: `${accentColor}18` }]}>
                      <Text style={[styles.parentNameText, { color: accentColor }]} numberOfLines={1}>
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Main Category Name — item.name directly from API */}
                <View style={styles.nameContainer}>
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {rawName}
                  </Text>
                </View>

                {/* Bottom Action Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.viewProductsText, { color: colors.primary }]}>
                    View Products
                  </Text>
                  <View style={[styles.arrowCircle, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                  </View>
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
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
    fontWeight: '500',
  },
  cartHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryCard: {
    width: CARD_WIDTH,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 112,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  accentPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  parentNameText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 4,
  },
  categoryName: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 0.5,
    marginTop: 6,
  },
  viewProductsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  cardSkeleton: {
    width: CARD_WIDTH,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 112,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 12.5,
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
