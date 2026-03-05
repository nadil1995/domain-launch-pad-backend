class Review {
  final String id;
  final String userId;
  final String menuItemId;
  final String restaurantId;
  final int rating;
  final String? comment;
  final DateTime createdAt;
  final ReviewUser? user;

  Review({
    required this.id,
    required this.userId,
    required this.menuItemId,
    required this.restaurantId,
    required this.rating,
    this.comment,
    required this.createdAt,
    this.user,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String,
      userId: json['userId'] as String,
      menuItemId: json['menuItemId'] as String,
      restaurantId: json['restaurantId'] as String,
      rating: json['rating'] as int,
      comment: json['comment'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: json['user'] != null
          ? ReviewUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'menuItemId': menuItemId,
      'restaurantId': restaurantId,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
      'user': user?.toJson(),
    };
  }
}

class ReviewUser {
  final String id;
  final String name;
  final String? avatar;

  ReviewUser({
    required this.id,
    required this.name,
    this.avatar,
  });

  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(
      id: json['id'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
    };
  }
}

class CreateReviewRequest {
  final String menuItemId;
  final String restaurantId;
  final int rating;
  final String? comment;

  CreateReviewRequest({
    required this.menuItemId,
    required this.restaurantId,
    required this.rating,
    this.comment,
  });

  Map<String, dynamic> toJson() {
    return {
      'menuItemId': menuItemId,
      'restaurantId': restaurantId,
      'rating': rating,
      'comment': comment,
    };
  }
}
