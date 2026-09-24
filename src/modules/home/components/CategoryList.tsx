import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { Category } from '../../products/types/product';

interface CategoryListProps {
  categories: Category[];
  onSelectCategory: (categoryId: string, categoryName: string) => void;
  onViewAllCategories?: () => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onSelectCategory,
  onViewAllCategories,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  const displayCategories = React.useMemo(() => {
    const allTab = { id: 'all', name: 'All' };
    const mapped = (categories ?? [])
      .filter(c => String(c.id) !== 'all' && (c.name || '').trim().toLowerCase() !== 'all')
      .map(category => ({
        id: String(category.id),
        name: category.name,
      }));
    return [allTab, ...mapped];
  }, [categories]);

  return (
    <View style={styles.wrapper}>
      {/* Section Header */}
      <View style={[styles.headerRow, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          Explore Categories
        </Text>
        {onViewAllCategories && (
          <TouchableOpacity onPress={onViewAllCategories} style={styles.viewAllBtn} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Category Selector Bar (Matching Product List Design) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingHorizontal: spacing.md }]}
      >
        {displayCategories.map(category => {
          const isAll = category.id === 'all';

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() =>
                onSelectCategory(
                  category.id,
                  isAll ? 'All Products' : category.name
                )
              }
              activeOpacity={0.75}
              style={[
                styles.catTab,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              {isAll && (
                <Ionicons
                  name="grid-outline"
                  size={13}
                  color={colors.primary}
                  style={styles.catTabIcon}
                />
              )}
              <Text
                style={[
                  styles.catTabText,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginRight: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  catTabIcon: {
    marginRight: 6,
  },
  catTabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
