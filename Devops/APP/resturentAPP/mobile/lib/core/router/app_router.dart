import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/restaurant/screens/restaurant_detail_screen.dart';
import '../../features/menu/screens/menu_item_detail_screen.dart';
import '../../features/reviews/screens/write_review_screen.dart';
import '../../features/restaurant/screens/saved_screen.dart';
import '../../features/restaurant/screens/search_screen.dart';
import '../../features/auth/screens/profile_screen.dart';

// GoRouter provider
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: authState.isAuthenticated ? '/home' : '/login',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      // If not authenticated and not on login/register, redirect to login
      if (!isAuth && !isLoggingIn) {
        return '/login';
      }

      // If authenticated and on login/register, redirect to home
      if (isAuth && isLoggingIn) {
        return '/home';
      }

      return null;
    },
    routes: [
      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // Home shell route with bottom nav
      ShellRoute(
        builder: (context, state, child) {
          return _MainShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/map',
            builder: (context, state) => const _MapScreen(),
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) => const SearchScreen(),
          ),
          GoRoute(
            path: '/saved',
            builder: (context, state) => const SavedScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),

      // Detail routes
      GoRoute(
        path: '/restaurant/:id',
        builder: (context, state) {
          final restaurantId = state.pathParameters['id']!;
          return RestaurantDetailScreen(restaurantId: restaurantId);
        },
      ),
      GoRoute(
        path: '/menu-item/:id',
        builder: (context, state) {
          final menuItemId = state.pathParameters['id']!;
          return MenuItemDetailScreen(menuItemId: menuItemId);
        },
      ),
      GoRoute(
        path: '/review/:menuItemId/:restaurantId',
        builder: (context, state) {
          final menuItemId = state.pathParameters['menuItemId']!;
          final restaurantId = state.pathParameters['restaurantId']!;
          return WriteReviewScreen(
            menuItemId: menuItemId,
            restaurantId: restaurantId,
          );
        },
      ),

      // Owner routes
      GoRoute(
        path: '/owner/dashboard',
        builder: (context, state) => const _OwnerDashboardScreen(),
      ),
    ],
  );
});

// Main shell with bottom navigation
class _MainShell extends StatefulWidget {
  final Widget child;

  const _MainShell({required this.child});

  @override
  State<_MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<_MainShell> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });

    // Navigate based on selected index
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/map');
        break;
      case 2:
        context.go('/search');
        break;
      case 3:
        context.go('/saved');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.bookmark), label: 'Saved'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

// Placeholder screens for upcoming features

class _MapScreen extends StatelessWidget {
  const _MapScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nearby Restaurants')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('Map feature coming soon!'),
          ],
        ),
      ),
    );
  }
}

class _OwnerDashboardScreen extends StatelessWidget {
  const _OwnerDashboardScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Restaurant Dashboard')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.dashboard, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('Owner dashboard coming soon!'),
          ],
        ),
      ),
    );
  }
}
