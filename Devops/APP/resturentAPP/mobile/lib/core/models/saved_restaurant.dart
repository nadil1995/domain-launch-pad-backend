import 'restaurant.dart';

class SavedRestaurant {
  final String userId;
  final String restaurantId;
  final DateTime createdAt;
  final Restaurant? restaurant;

  SavedRestaurant({
    required this.userId,
    required this.restaurantId,
    required this.createdAt,
    this.restaurant,
  });

  factory SavedRestaurant.fromJson(Map<String, dynamic> json) {
    return SavedRestaurant(
      userId: json['userId'] as String,
      restaurantId: json['restaurantId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      restaurant: json['restaurant'] != null
          ? Restaurant.fromJson(json['restaurant'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'restaurantId': restaurantId,
      'createdAt': createdAt.toIso8601String(),
      'restaurant': restaurant?.toJson(),
    };
  }
}
