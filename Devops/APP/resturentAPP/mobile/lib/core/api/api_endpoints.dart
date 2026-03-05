class ApiEndpoints {
  static const String baseUrl = 'http://localhost:3000/api';

  // Auth
  static const String register = '$baseUrl/auth/register';
  static const String login = '$baseUrl/auth/login';
  static const String google = '$baseUrl/auth/google';
  static const String apple = '$baseUrl/auth/apple';

  // Restaurants
  static const String restaurants = '$baseUrl/restaurants';
  static String restaurantDetail(String id) => '$baseUrl/restaurants/$id';

  // Menu Items
  static String restaurantMenu(String restaurantId) => '$baseUrl/menu/restaurant/$restaurantId';
  static String menuItemDetail(String id) => '$baseUrl/menu/$id';

  // Reviews
  static String itemReviews(String menuItemId) => '$baseUrl/reviews/item/$menuItemId';
  static const String createReview = '$baseUrl/reviews';
  static String updateReview(String id) => '$baseUrl/reviews/$id';
  static String deleteReview(String id) => '$baseUrl/reviews/$id';

  // Promotions
  static String restaurantPromotions(String restaurantId) => '$baseUrl/promotions/restaurant/$restaurantId';
  static String createPromotion(String restaurantId) => '$baseUrl/promotions/restaurant/$restaurantId';
  static String updatePromotion(String id) => '$baseUrl/promotions/$id';
  static String deletePromotion(String id) => '$baseUrl/promotions/$id';

  // Saved Restaurants
  static const String savedRestaurants = '$baseUrl/saved';
  static String saveRestaurant(String id) => '$baseUrl/saved/$id';
  static String unsaveRestaurant(String id) => '$baseUrl/saved/$id';
}
