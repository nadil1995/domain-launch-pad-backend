class Restaurant {
  final String id;
  final String name;
  final String address;
  final double lat;
  final double lng;
  final String cuisineType;
  final String? description;
  final String? coverImage;
  final double rating;
  final int reviewCount;
  final DateTime createdAt;

  Restaurant({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
    required this.cuisineType,
    this.description,
    this.coverImage,
    required this.rating,
    required this.reviewCount,
    required this.createdAt,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      cuisineType: json['cuisineType'] as String,
      description: json['description'] as String?,
      coverImage: json['coverImage'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'lat': lat,
      'lng': lng,
      'cuisineType': cuisineType,
      'description': description,
      'coverImage': coverImage,
      'rating': rating,
      'reviewCount': reviewCount,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class MenuItem {
  final String id;
  final String restaurantId;
  final String name;
  final String? description;
  final double price;
  final String category;
  final bool isStarDish;
  final bool isSignature;
  final bool isNew;
  final double rating;
  final int reviewCount;

  MenuItem({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    required this.price,
    required this.category,
    required this.isStarDish,
    required this.isSignature,
    required this.isNew,
    required this.rating,
    required this.reviewCount,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] as String,
      restaurantId: json['restaurantId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: (json['price'] as num).toDouble(),
      category: json['category'] as String,
      isStarDish: json['isStarDish'] as bool? ?? false,
      isSignature: json['isSignature'] as bool? ?? false,
      isNew: json['isNew'] as bool? ?? false,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'restaurantId': restaurantId,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'isStarDish': isStarDish,
      'isSignature': isSignature,
      'isNew': isNew,
      'rating': rating,
      'reviewCount': reviewCount,
    };
  }
}
