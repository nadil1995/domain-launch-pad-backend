import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:math' as math;
import '../../../core/models/restaurant.dart';
import '../../../core/theme/app_colors.dart';
import '../../restaurant/providers/restaurant_provider.dart';

// Location provider using geolocator
final locationProvider = FutureProvider<Position?>((ref) async {
  try {
    final hasPermission = await _requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 10),
    );
    return position;
  } catch (e) {
    return null;
  }
});

// Nearby restaurants with distance calculation
final nearbyRestaurantsProvider =
    FutureProvider<List<(Restaurant, double)>>((ref) async {
  final position = await ref.watch(locationProvider.future);
  final allRestaurants = await ref.watch(restaurantListProvider.future);

  if (position == null) {
    return allRestaurants.map((r) => (r, 0.0)).toList();
  }

  // Calculate distances using Haversine formula
  final restaurantsWithDistance = allRestaurants.map((restaurant) {
    final distance = _calculateDistance(
      position.latitude,
      position.longitude,
      restaurant.lat,
      restaurant.lng,
    );
    return (restaurant, distance);
  }).toList();

  // Sort by distance
  restaurantsWithDistance.sort((a, b) => a.$2.compareTo(b.$2));

  // Return only restaurants within 10 km
  return restaurantsWithDistance.where((item) => item.$2 <= 10).toList();
});

class MapScreen extends ConsumerWidget {
  const MapScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationAsync = ref.watch(locationProvider);
    final nearbyAsync = ref.watch(nearbyRestaurantsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Restaurants'),
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: locationAsync.when(
                data: (position) {
                  if (position == null) {
                    return const Tooltip(
                      message: 'Location disabled',
                      child: Icon(Icons.location_off, color: Colors.grey),
                    );
                  }
                  return Tooltip(
                    message: 'Location enabled',
                    child: Icon(
                      Icons.location_on,
                      color: AppColors.primary,
                    ),
                  );
                },
                loading: () => const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                error: (_, __) => const Icon(
                  Icons.location_off,
                  color: Colors.grey,
                ),
              ),
            ),
          ),
        ],
      ),
      body: locationAsync.when(
        data: (position) {
          if (position == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.location_disabled,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  const Text('Location access denied'),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      'Please enable location permissions in settings to see nearby restaurants',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.settings),
                    label: const Text('Open Settings'),
                    onPressed: () => Geolocator.openLocationSettings(),
                  ),
                ],
              ),
            );
          }

          return nearbyAsync.when(
            data: (restaurants) {
              return SingleChildScrollView(
                child: Column(
                  children: [
                    // Current location info
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.location_on,
                                color: AppColors.primary,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Your Location',
                                style:
                                    Theme.of(context).textTheme.titleMedium,
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Showing ${restaurants.length} restaurants within 10 km',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),

                    if (restaurants.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 64),
                        child: Column(
                          children: [
                            Icon(
                              Icons.restaurant,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            const Text('No restaurants nearby'),
                          ],
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: restaurants.length,
                        itemBuilder: (context, index) {
                          final (restaurant, distance) = restaurants[index];
                          return _NearbyRestaurantCard(
                            restaurant: restaurant,
                            distance: distance,
                            onTap: () {
                              context.go('/restaurant/${restaurant.id}');
                            },
                          );
                        },
                      ),
                  ],
                ),
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(),
            ),
            error: (err, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Colors.red[400],
                  ),
                  const SizedBox(height: 16),
                  Text('Error: $err'),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 48,
                color: Colors.red[400],
              ),
              const SizedBox(height: 16),
              const Text('Failed to get location'),
            ],
          ),
        ),
      ),
    );
  }
}

class _NearbyRestaurantCard extends StatelessWidget {
  final Restaurant restaurant;
  final double distance;
  final VoidCallback onTap;

  const _NearbyRestaurantCard({
    required this.restaurant,
    required this.distance,
    required this.onTap,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: AppColors.surface,
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 100,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
                color: AppColors.primary.withValues(alpha: 0.1),
              ),
              child: Center(
                child: Text(restaurant.name[0], style: const TextStyle(fontSize: 40)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              restaurant.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              restaurant.cuisineType,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.directions,
                                size: 14, color: AppColors.primary),
                            const SizedBox(width: 4),
                            Text(
                              '${distance.toStringAsFixed(1)} km',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.star, size: 14, color: AppColors.accent),
                          const SizedBox(width: 4),
                          Text(
                            '${restaurant.rating.toStringAsFixed(1)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Text(
                        '${restaurant.reviewCount} reviews',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Helper function to calculate distance using Haversine formula
double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const earthRadiusKm = 6371;

  final dLat = _degreesToRadians(lat2 - lat1);
  final dLon = _degreesToRadians(lon2 - lon1);

  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_degreesToRadians(lat1)) *
          math.cos(_degreesToRadians(lat2)) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);

  final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  final distance = earthRadiusKm * c;

  return distance;
}

double _degreesToRadians(double degrees) {
  return degrees * math.pi / 180;
}

// Request location permission
Future<bool> _requestLocationPermission() async {
  final permission = await Geolocator.requestPermission();
  return permission == LocationPermission.always ||
      permission == LocationPermission.whileInUse;
}
