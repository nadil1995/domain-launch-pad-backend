import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/saved_restaurant.dart';
import './restaurant_provider.dart';

// Saved restaurants provider
final savedRestaurantsProvider = FutureProvider<List<SavedRestaurant>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getSavedRestaurants();
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => SavedRestaurant.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Failed to fetch saved restaurants: $e');
  }
});

// Save restaurant mutation
final saveRestaurantProvider = FutureProvider.family<SavedRestaurant, String>((ref, restaurantId) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.saveRestaurant(restaurantId);
    // Refresh saved restaurants list after saving
    ref.refresh(savedRestaurantsProvider);
    return SavedRestaurant.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (e) {
    throw Exception('Failed to save restaurant: $e');
  }
});

// Unsave restaurant mutation
final unsaveRestaurantProvider = FutureProvider.family<void, String>((ref, restaurantId) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    await apiClient.unsaveRestaurant(restaurantId);
    // Refresh saved restaurants list after unsaving
    ref.refresh(savedRestaurantsProvider);
  } catch (e) {
    throw Exception('Failed to unsave restaurant: $e');
  }
});

// Check if restaurant is saved
final isRestaurantSavedProvider = FutureProvider.family<bool, String>((ref, restaurantId) async {
  final saved = await ref.watch(savedRestaurantsProvider.future);
  return saved.any((s) => s.restaurantId == restaurantId);
});
