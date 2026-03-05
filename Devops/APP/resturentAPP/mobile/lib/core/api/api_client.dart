import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio _dio;
  final _secureStorage = const FlutterSecureStorage();

  // Change this based on your environment:
  // macOS/Windows (Docker Desktop): http://localhost:3000/api
  // Android Emulator: http://10.0.2.2:3000/api
  // Physical Device: http://<YOUR_IP>:3000/api (e.g., http://192.168.1.100:3000/api)
  static const String _baseUrl = 'http://localhost:3000/api';

  ApiClient({Dio? dio}) : _dio = dio ?? Dio() {
    _dio.options.baseUrl = _baseUrl;
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add JWT token to all requests
          final token = await _secureStorage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Handle 401 responses (unauthorized)
          if (error.response?.statusCode == 401) {
            // Clear stored token
            _secureStorage.delete(key: 'auth_token');
            // Optionally: redirect to login screen
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth requests
  Future<Response> register(String email, String name, String password, {String role = 'CUSTOMER'}) {
    return _dio.post(
      '/auth/register',
      data: {
        'email': email,
        'name': name,
        'password': password,
        'role': role,
      },
    );
  }

  Future<Response> login(String email, String password) {
    return _dio.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );
  }

  Future<Response> googleSignIn(String googleId, String email, String name, String? avatar) {
    return _dio.post(
      '/auth/google',
      data: {
        'googleId': googleId,
        'email': email,
        'name': name,
        'avatar': avatar,
      },
    );
  }

  // Token management
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }

  Future<void> clearToken() async {
    await _secureStorage.delete(key: 'auth_token');
  }

  // Generic GET request
  Future<Response> get(String url, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(url, queryParameters: queryParameters);
  }

  // Generic POST request
  Future<Response> post(String url, {required dynamic data}) {
    return _dio.post(url, data: data);
  }

  // Generic PUT request
  Future<Response> put(String url, {required dynamic data}) {
    return _dio.put(url, data: data);
  }

  // Generic DELETE request
  Future<Response> delete(String url) {
    return _dio.delete(url);
  }

  // Restaurant requests
  Future<Response> getRestaurants({
    String? name,
    String? cuisine,
    double? lat,
    double? lng,
    double? radius,
  }) {
    return _dio.get(
      '/restaurants',
      queryParameters: {
        if (name != null) 'name': name,
        if (cuisine != null) 'cuisine': cuisine,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (radius != null) 'radius': radius,
      },
    );
  }

  Future<Response> getRestaurantById(String id) {
    return _dio.get('/restaurants/$id');
  }

  Future<Response> getTrendingRestaurants({double? lat, double? lng}) {
    return _dio.get(
      '/restaurants/trending/all',
      queryParameters: {
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
      },
    );
  }

  Future<Response> getRecommendedRestaurants(
    String userId, {
    required double lat,
    required double lng,
  }) {
    return _dio.get(
      '/restaurants/recommended/$userId',
      queryParameters: {'lat': lat, 'lng': lng},
    );
  }

  // Menu requests
  Future<Response> getMenuItems(String restaurantId) {
    return _dio.get('/menu/restaurant/$restaurantId');
  }

  Future<Response> getMenuItemById(String id) {
    return _dio.get('/menu/$id');
  }

  // Review requests
  Future<Response> getReviews(String menuItemId) {
    return _dio.get('/reviews/item/$menuItemId');
  }

  Future<Response> createReview({
    required String menuItemId,
    required String restaurantId,
    required int rating,
    String? comment,
  }) {
    return _dio.post(
      '/reviews',
      data: {
        'menuItemId': menuItemId,
        'restaurantId': restaurantId,
        'rating': rating,
        'comment': comment,
      },
    );
  }

  Future<Response> updateReview(String id, {int? rating, String? comment}) {
    return _dio.put(
      '/reviews/$id',
      data: {
        if (rating != null) 'rating': rating,
        if (comment != null) 'comment': comment,
      },
    );
  }

  Future<Response> deleteReview(String id) {
    return _dio.delete('/reviews/$id');
  }

  // Saved restaurants
  Future<Response> getSavedRestaurants() {
    return _dio.get('/saved');
  }

  Future<Response> saveRestaurant(String restaurantId) {
    return _dio.post(
      '/saved/$restaurantId',
      data: {},
    );
  }

  Future<Response> unsaveRestaurant(String restaurantId) {
    return _dio.delete('/saved/$restaurantId');
  }

  // Promotions
  Future<Response> getPromotions(String restaurantId) {
    return _dio.get(
      '/promotions/restaurant/$restaurantId',
    );
  }
}
