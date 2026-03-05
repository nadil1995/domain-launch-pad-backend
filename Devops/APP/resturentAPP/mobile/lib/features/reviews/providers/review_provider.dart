import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/review.dart';
import '../../restaurant/providers/restaurant_provider.dart';

// Reviews provider
final reviewsProvider = FutureProvider.family<List<Review>, String>((ref, menuItemId) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.getReviews(menuItemId);
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => Review.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Failed to fetch reviews: $e');
  }
});

// Create review future provider
final createReviewProvider = FutureProvider.family<Review, CreateReviewRequest>((ref, request) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.createReview(
      menuItemId: request.menuItemId,
      restaurantId: request.restaurantId,
      rating: request.rating,
      comment: request.comment,
    );
    return Review.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (e) {
    throw Exception('Failed to create review: $e');
  }
});
