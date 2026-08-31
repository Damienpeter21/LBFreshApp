import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader, EmptyState } from '../../../components';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types/product';

interface ProductDetailsScreenProps {
  product: Product;
  onBack: () => void;
  onNavigateToCart: () => void;
  onRequireAuthForCheckout: () => void;
}

const getCategoryIcon = (category?: string): string => {
  switch ((category ?? '').toLowerCase()) {
    case 'vegetables':
      return 'leaf-outline';
    case 'fruits':
      return 'nutrition-outline';
    case 'grocery':
      return 'basket-outline';
    case 'electronics':
      return 'headset-outline';
    case 'dairy':
      return 'cafe-outline';
    case 'snacks':
      return 'fast-food-outline';
    default:
      return 'cube-outline';
  }
};

export const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({
  product,
  onBack,
  onNavigateToCart,
  onRequireAuthForCheckout,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { isAuthenticated } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorite = product ? isInWishlist(product.id) : false;

  const cartItem = items.find(item => item.product.id === product?.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleBuyNow = () => {
    if (!product) return;
    if (quantity === 0) {
      addToCart(product, 1);
    }
    if (!isAuthenticated) {
      onRequireAuthForCheckout();
    } else {
      onNavigateToCart();
    }
  };

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Product Details" onBack={onBack} />
        <EmptyState
          iconName="cube-outline"
          badgeIcon="alert-circle"
          title="Product Unavailable"
          description="The product you are looking for is currently unavailable or has been moved."
          actionLabel="Go Back"
          onAction={onBack}
        />
      </View>
    );
  }

  const categoryIcon = getCategoryIcon(product.category);
  const discount = product.discountPercentage ?? 0;
  const originalPrice = product.originalPrice ?? product.price ?? 0;
  const rating = product.rating ?? 4.5;
  const reviewsCount = product.reviewsCount ?? 120;
  const unit = product.unit ?? '1 unit';
  const deliveryTime = product.deliveryTime ?? '15 mins';
  const tags = product.tags ?? ['BASKET Verified'];
  const description =
    product.description ||
    'High quality product sourced directly from verified suppliers and inspected for peak freshness and reliability.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={product.name ?? 'Details'}
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            onPress={() => toggleWishlist(product)}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? colors.error : colors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Hero Image / Modern Placeholder */}
        <View style={[styles.heroContainer, { backgroundColor: colors.surfaceVariant }]}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <View
                style={[
                  styles.heroIconCircle,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name={categoryIcon} size={64} color={colors.primary} />
              </View>
              <View style={[styles.verifiedPill, { backgroundColor: colors.primaryVariant }]}>
                <Ionicons name="shield-checkmark" size={12} color={colors.secondary} style={{ marginRight: 4 }} />
                <Text style={[styles.verifiedPillText, { color: colors.onPrimary }]}>
                  LBFresh 100% Quality Guaranteed
                </Text>
              </View>
            </View>
          )}

          {discount > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: '#DC2626' }]}>
              <Text style={[styles.discountBadgeText, { color: '#FFFFFF' }]}>
                {discount}% OFF
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
          {/* Tags & Express Delivery Badge */}
          <View style={styles.tagRow}>
            <View style={styles.tagChipsList}>
              {tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.deliveryBadge}>
              <Ionicons name="flash" size={13} color={colors.secondary} style={{ marginRight: 3 }} />
              <Text style={[styles.deliveryInfo, { color: colors.primary }]}>
                {deliveryTime}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {product.name}
          </Text>

          {/* Unit & Rating */}
          <View style={styles.metaRow}>
            <Text style={[styles.unit, { color: colors.textSecondary }]}>
              Net Quantity: {unit}
            </Text>
            <View style={[styles.ratingBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.warning }]}>
              <Ionicons name="star" size={12} color={colors.warning} style={{ marginRight: 3 }} />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                {rating} ({reviewsCount} reviews)
              </Text>
            </View>
          </View>

          {/* Price Row with Savings pill */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              ₹{product.price ?? 0}
            </Text>
            {originalPrice > (product.price ?? 0) && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                MRP ₹{originalPrice}
              </Text>
            )}
            <Text style={[styles.inclusiveText, { color: colors.textSecondary }]}>
              (Inclusive of all taxes)
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Product Highlights */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Product Highlights
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>

          {/* Trust Guarantees */}
          <View style={styles.featuresWrapper}>
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                100% Genuine & Verified Product Quality
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="flash" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Express Delivery with Live Order Tracking
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="repeat" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Hassle-free 7 Days Easy Returns & Replacement
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar with Safe Insets */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        {quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => addToCart(product, 1)}
            style={[
              styles.cartActionButton,
              {
                borderColor: colors.primary,
                borderWidth: 1.5,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={[styles.cartActionText, { color: colors.primary }]}>
              ADD TO CART
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.stepperContainer,
              {
                borderColor: colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => updateQuantity(product.id, quantity - 1)}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.stepperQty, { color: colors.primary }]}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(product.id, quantity + 1)}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleBuyNow}
          style={[
            styles.buyNowButton,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Text style={[styles.buyNowText, { color: colors.onPrimary }]}>BUY NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  backHomeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backHomeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroIconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailsCard: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagChipsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryInfo: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  inclusiveText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  featuresWrapper: {
    marginTop: 14,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  bottomBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  cartActionButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepperContainer: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  stepperBtn: {
    padding: 8,
  },
  stepperQty: {
    fontSize: 16,
    fontWeight: '800',
  },
  buyNowButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buyNowText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
