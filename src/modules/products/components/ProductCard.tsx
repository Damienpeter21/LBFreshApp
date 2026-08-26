import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { useCart } from '../../cart';
import { Product } from '../types/product';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onRequireAuth?: () => void;
}

const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
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

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const { items, addToCart, updateQuantity } = useCart();

  const cartItem = items.find(item => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e: any) => {
    e.stopPropagation?.();
    addToCart(product, 1);
  };

  const handleIncrement = (e: any) => {
    e.stopPropagation?.();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: any) => {
    e.stopPropagation?.();
    updateQuantity(product.id, quantity - 1);
  };

  const categoryIcon = getCategoryIcon(product.category);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(product)}
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.sm + 2,
        },
      ]}
    >
      {/* Discount Badge */}
      {product.discountPercentage > 0 && (
        <View
          style={[
            styles.discountBadge,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.discountText,
              { color: colors.onSecondary },
            ]}
          >
            {product.discountPercentage}% OFF
          </Text>
        </View>
      )}

      {/* Product Image / Modern Placeholder */}
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderBox}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name={categoryIcon} size={28} color={colors.primary} />
            </View>
            <Text style={[styles.placeholderLabel, { color: colors.textSecondary }]}>
              {product.category.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Delivery Time & Rating */}
      <View style={styles.metaRow}>
        <View style={[styles.timerBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="time-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
          <Text style={[styles.deliveryTime, { color: colors.textSecondary }]}>
            {product.deliveryTime}
          </Text>
        </View>
        <View
          style={[
            styles.ratingBadge,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.warning,
            },
          ]}
        >
          <Ionicons name="star" size={10} color={colors.warning} style={{ marginRight: 2 }} />
          <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
            {product.rating}
          </Text>
        </View>
      </View>

      {/* Title & Unit */}
      <Text
        style={[styles.title, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {product.name}
      </Text>
      <Text style={[styles.unit, { color: colors.textSecondary }]}>
        {product.unit}
      </Text>

      {/* Price & Action Row */}
      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{product.price}
          </Text>
          {product.originalPrice > product.price && (
            <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
              ₹{product.originalPrice}
            </Text>
          )}
        </View>

        {quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAdd}
            style={[
              styles.addButton,
              {
                borderColor: colors.primary,
                backgroundColor: colors.surface,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <Text style={[styles.addButtonText, { color: colors.primary }]}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.stepperContainer,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <TouchableOpacity onPress={handleDecrement} style={styles.stepperBtn}>
              <Ionicons name="remove" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: colors.onPrimary }]}>{quantity}</Text>
            <TouchableOpacity onPress={handleIncrement} style={styles.stepperBtn}>
              <Ionicons name="add" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    margin: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    zIndex: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  imageContainer: {
    height: 116,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  placeholderLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deliveryTime: {
    fontSize: 10,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    minHeight: 36,
    lineHeight: 18,
  },
  unit: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
});
