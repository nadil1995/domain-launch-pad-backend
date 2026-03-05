import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/restaurant.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/restaurant_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late TextEditingController _searchController;
  String? _selectedCuisine;
  double _maxDistance = 5.0;

  static const List<String> _cuisines = [
    'Italian',
    'Chinese',
    'Japanese',
    'Indian',
    'Mexican',
    'Thai',
    'Korean',
    'Vietnamese',
    'Mediterranean',
    'American',
  ];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _updateSearch() {
    final filters = ref.read(searchFiltersProvider);
    ref.read(searchFiltersProvider.notifier).state = filters.copyWith(
      name: _searchController.text.isEmpty ? null : _searchController.text,
      cuisine: _selectedCuisine,
      radius: _maxDistance,
    );
  }

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _selectedCuisine = null;
      _maxDistance = 5.0;
    });
    ref.read(searchFiltersProvider.notifier).state = SearchFilters();
  }

  @override
  Widget build(BuildContext context) {
    final searchResultsAsync = ref.watch(filteredRestaurantsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Restaurants'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search by restaurant name...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onChanged: (_) => _updateSearch(),
              ),
            ),

            // Cuisine filter
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cuisine Type',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 40,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _cuisines.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          // Clear button
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: const Text('All'),
                              selected: _selectedCuisine == null,
                              onSelected: (_) {
                                setState(() {
                                  _selectedCuisine = null;
                                });
                                _updateSearch();
                              },
                            ),
                          );
                        }

                        final cuisine = _cuisines[index - 1];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(cuisine),
                            selected: _selectedCuisine == cuisine,
                            onSelected: (_) {
                              setState(() {
                                _selectedCuisine =
                                    _selectedCuisine == cuisine ? null : cuisine;
                              });
                              _updateSearch();
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Distance filter
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Maximum Distance',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Slider(
                          value: _maxDistance,
                          min: 0.5,
                          max: 25.0,
                          divisions: 49,
                          label: '${_maxDistance.toStringAsFixed(1)} km',
                          onChanged: (value) {
                            setState(() {
                              _maxDistance = value;
                            });
                            _updateSearch();
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Text(
                          '${_maxDistance.toStringAsFixed(1)} km',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Clear filters button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _clearFilters,
                  child: const Text('Clear Filters'),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Results section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Results',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),

            const SizedBox(height: 12),

            // Search results
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: searchResultsAsync.when(
                data: (restaurants) {
                  if (restaurants.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.restaurant_menu,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No restaurants found',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Try adjusting your filters',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: restaurants.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final restaurant = restaurants[index];
                      return _SearchResultCard(
                        restaurant: restaurant,
                        onTap: () {
                          context.go('/restaurant/${restaurant.id}');
                        },
                      );
                    },
                  );
                },
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Center(
                    child: Column(
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
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final Restaurant restaurant;
  final VoidCallback onTap;

  const _SearchResultCard({
    required this.restaurant,
    required this.onTap,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
        child: Row(
          children: [
            Container(
              height: 120,
              width: 100,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  bottomLeft: Radius.circular(12),
                ),
                color: AppColors.primary.withValues(alpha: 0.1),
              ),
              child: Center(
                child: Text(
                  restaurant.name[0],
                  style: const TextStyle(fontSize: 40),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
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
                    const SizedBox(height: 4),
                    Text(
                      restaurant.address,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textSecondary,
                      ),
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
                            fontSize: 10,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
