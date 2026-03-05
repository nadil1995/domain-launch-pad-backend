import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/restaurant.dart';

// API client provider
final apiClientProvider = Provider((ref) => ApiClient());

// Restaurant list provider
final restaurantListProvider = FutureProvider<List<Restaurant>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getRestaurants();
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => Restaurant.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Failed to fetch restaurants: $e');
  }
});

// Restaurant detail provider
final restaurantDetailProvider = FutureProvider.family<Restaurant, String>((ref, id) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getRestaurantById(id);
    return Restaurant.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (e) {
    throw Exception('Failed to fetch restaurant: $e');
  }
});

// Trending restaurants provider
final trendingRestaurantsProvider = FutureProvider<List<Restaurant>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getTrendingRestaurants();
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => Restaurant.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Failed to fetch trending restaurants: $e');
  }
});

// Search filters state
class SearchFilters {
  final String? name;
  final String? cuisine;
  final double? lat;
  final double? lng;
  final double? radius;

  SearchFilters({
    this.name,
    this.cuisine,
    this.lat,
    this.lng,
    this.radius,
  });

  SearchFilters copyWith({
    String? name,
    String? cuisine,
    double? lat,
    double? lng,
    double? radius,
  }) {
    return SearchFilters(
      name: name ?? this.name,
      cuisine: cuisine ?? this.cuisine,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      radius: radius ?? this.radius,
    );
  }
}

// Search filters provider
final searchFiltersProvider = StateProvider<SearchFilters>((ref) {
  return SearchFilters();
});

// Filtered restaurants provider
final filteredRestaurantsProvider = FutureProvider<List<Restaurant>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final filters = ref.watch(searchFiltersProvider);

  try {
    final response = await apiClient.getRestaurants(
      name: filters.name,
      cuisine: filters.cuisine,
      lat: filters.lat,
      lng: filters.lng,
      radius: filters.radius,
    );
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => Restaurant.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Failed to search restaurants: $e');
  }
});
