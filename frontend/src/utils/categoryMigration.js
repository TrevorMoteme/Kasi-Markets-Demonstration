// src/utils/categoryMigration.js
// Helper to migrate old category data to new format

import { mapOldCategoryToId, getAllCategoryIds } from './categoryConstants';

// Migrate a single category value
export const migrateCategory = (oldCategory) => {
  if (!oldCategory) return null;

  // If it's already a valid ID, return it
  const validIds = getAllCategoryIds();
  if (validIds.includes(oldCategory)) {
    return oldCategory;
  }

  // Otherwise map it
  const mapped = mapOldCategoryToId(oldCategory);

  // If mapping returned the same value and it's not a valid ID, log warning
  if (mapped === oldCategory && !validIds.includes(oldCategory)) {
    console.warn(`⚠️ Unknown category: "${oldCategory}" - keeping as is`);
  }

  return mapped;
};

// Migrate an array of categories
export const migrateCategories = (oldCategories) => {
  if (!oldCategories || !Array.isArray(oldCategories)) return [];
  return oldCategories.map(cat => migrateCategory(cat)).filter(Boolean);
};

// Check if a category needs migration
export const needsMigration = (category) => {
  if (!category) return false;
  const validIds = getAllCategoryIds();
  return !validIds.includes(category) && category !== mapOldCategoryToId(category);
};

// Log migration issues for debugging
export const debugCategoryMigration = (categories) => {
  const issues = [];
  categories.forEach(cat => {
    if (needsMigration(cat)) {
      issues.push({
        original: cat,
        migrated: migrateCategory(cat),
        needsAttention: migrateCategory(cat) === cat
      });
    }
  });
  return issues;
};

// Create a mapping from display names to IDs for backward compatibility
export const getCategoryDisplayNameToIdMap = () => {
  const { CATEGORIES } = require('./categoryConstants');
  const map = {};
  Object.values(CATEGORIES).forEach(cat => {
    map[cat.displayName] = cat.id;
  });
  return map;
};