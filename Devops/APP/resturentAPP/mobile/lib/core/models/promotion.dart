class Promotion {
  final String id;
  final String restaurantId;
  final String title;
  final String? description;
  final double? discountPercent;
  final double? discountAmount;
  final DateTime validUntil;
  final bool isActive;
  final DateTime createdAt;

  Promotion({
    required this.id,
    required this.restaurantId,
    required this.title,
    this.description,
    this.discountPercent,
    this.discountAmount,
    required this.validUntil,
    required this.isActive,
    required this.createdAt,
  });

  factory Promotion.fromJson(Map<String, dynamic> json) {
    return Promotion(
      id: json['id'] as String,
      restaurantId: json['restaurantId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      discountPercent: json['discountPercent'] != null
          ? (json['discountPercent'] as num).toDouble()
          : null,
      discountAmount: json['discountAmount'] != null
          ? (json['discountAmount'] as num).toDouble()
          : null,
      validUntil: DateTime.parse(json['validUntil'] as String),
      isActive: json['isActive'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'restaurantId': restaurantId,
      'title': title,
      'description': description,
      'discountPercent': discountPercent,
      'discountAmount': discountAmount,
      'validUntil': validUntil.toIso8601String(),
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
