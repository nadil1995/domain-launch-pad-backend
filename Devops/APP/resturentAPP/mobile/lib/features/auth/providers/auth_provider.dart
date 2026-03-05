import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/user.dart';

// API Client provider
final apiClientProvider = Provider((ref) => ApiClient());

// Auth state provider
class AuthState {
  final User? user;
  final String? token;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.token,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => token != null;

  AuthState copyWith({
    User? user,
    String? token,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient apiClient;

  AuthNotifier(this.apiClient) : super(AuthState());

  Future<void> register(String email, String name, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await apiClient.register(email, name, password);
      final authResponse = AuthResponse.fromJson(response.data['data']);
      await apiClient.saveToken(authResponse.token);
      state = state.copyWith(
        user: authResponse.user,
        token: authResponse.token,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await apiClient.login(email, password);
      final authResponse = AuthResponse.fromJson(response.data['data']);
      await apiClient.saveToken(authResponse.token);
      state = state.copyWith(
        user: authResponse.user,
        token: authResponse.token,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  Future<void> logout() async {
    await apiClient.clearToken();
    state = AuthState();
  }

  Future<void> checkAuthStatus() async {
    final token = await apiClient.getToken();
    if (token != null) {
      // Token exists, user is authenticated
      state = state.copyWith(token: token);
    }
  }
}

// Auth provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.watch(apiClientProvider)),
);
