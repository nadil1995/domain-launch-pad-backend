import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/restaurant.dart';
import '../../restaurant/providers/restaurant_provider.dart';

// Menu items provider
final menuItemsProvider = FutureProvider.family<List<MenuItem>, String>((ref, restaurantId) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getMenuItems(restaurantId);
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => MenuItem.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Failed to fetch menu items: $e');
  }
});

// Menu item detail provider
final menuItemDetailProvider = FutureProvider.family<MenuItem, String>((ref, id) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getMenuItemById(id);
    return MenuItem.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (e) {
    throw Exception('Failed to fetch menu item: $e');
  }
});
