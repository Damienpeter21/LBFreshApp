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
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionHeading, { color: colors.textPrimary, paddingHorizontal: spacing.md }]}>
        Shop by Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingHorizontal: spacing.md }]}
      >
        {categories.map(category => {
          const isSelected = selectedCategory === category.id;
          const icon = category.iconName || 'grid-outline';

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: borderRadius.full,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={16}
                color={isSelected ? colors.onPrimary : colors.primary}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? colors.onPrimary : colors.textPrimary,
                    fontWeight: isSelected ? '700' : '500',
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
    marginVertical: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
  },
});
