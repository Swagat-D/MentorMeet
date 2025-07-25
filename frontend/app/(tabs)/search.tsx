// app/(tabs)/search.tsx - Professional Clean Design
import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from '@expo/vector-icons';
import mentorService, { MentorProfile, MentorSearchFilters } from "@/services/mentorService";
import MentorCard from "@/components/cards/MentorCard";

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableExpertise, setAvailableExpertise] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch mentors
  const fetchMentors = async (isRefresh = false, searchTerm = "", pageNum = 1) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filters: MentorSearchFilters = {
        search: searchTerm.trim(),
        subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
        expertise: selectedExpertise.length > 0 ? selectedExpertise : undefined,
        page: pageNum,
        limit: 10,
        sortBy: 'rating',
        sortOrder: 'desc'
      };

      console.log('🔍 Searching mentors with filters:', filters);

      const result = await mentorService.searchMentors(filters);
      
      if (pageNum === 1) {
        setMentors(result.mentors);
        
        // Update available filters
        if (result.filters) {
          setAvailableSubjects(result.filters.availableSubjects || []);
          setAvailableExpertise(result.filters.availableExpertise || []);
        }
      } else {
        setMentors(prev => [...prev, ...result.mentors]);
      }

      setHasMore(result.page < result.totalPages);
      setPage(pageNum);

      console.log(`✅ Loaded ${result.mentors.length} mentors (page ${pageNum})`);

    } catch (error: any) {
      console.error('❌ Error fetching mentors:', error);
      Alert.alert('Error', 'Failed to load mentors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMentors();
  }, []);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMentors(false, searchQuery, 1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedSubjects, selectedExpertise]);

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const toggleExpertise = (expertise: string) => {
    if (selectedExpertise.includes(expertise)) {
      setSelectedExpertise(selectedExpertise.filter((e) => e !== expertise));
    } else {
      setSelectedExpertise([...selectedExpertise, expertise]);
    }
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedExpertise([]);
    setSearchQuery("");
    fetchMentors(true);
  };

  const onRefresh = () => {
    fetchMentors(true, searchQuery, 1);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMentors(false, searchQuery, page + 1);
    }
  };

  const renderFilterChip = ({ item, isSelected, onToggle }: { 
    item: string; 
    isSelected: boolean; 
    onToggle: () => void; 
  }) => (
    <TouchableOpacity
      style={[styles.filterChip, isSelected && styles.selectedFilterChip]}
      onPress={onToggle}
    >
      <Text style={[styles.filterChipText, isSelected && styles.selectedFilterChipText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderMentor = ({ item }: { item: MentorProfile }) => (
    <MentorCard mentor={item} variant="default" />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#8B4513" />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  const getActiveFiltersCount = () => {
    return selectedSubjects.length + selectedExpertise.length;
  };

  if (loading && mentors.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchHeader}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#8B7355" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search mentors..."
              placeholderTextColor="#8B7355"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={20} color="#8B7355" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Finding mentors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#8B7355" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mentors by name or expertise..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="clear" size={20} color="#8B7355" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialIcons 
            name="tune" 
            size={20} 
            color={getActiveFiltersCount() > 0 ? "#FFFFFF" : "#8B7355"} 
          />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersText}>
                {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} active
              </Text>
              <TouchableOpacity onPress={clearFilters} style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expertise Filters */}
          {availableExpertise.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Expertise</Text>
              <View style={styles.filterChipsContainer}>
                {availableExpertise.slice(0, showFilters ? availableExpertise.length : 6).map((item) => 
                  renderFilterChip({
                    item,
                    isSelected: selectedExpertise.includes(item),
                    onToggle: () => toggleExpertise(item)
                  })
                )}
              </View>
            </View>
          )}

          {/* Subject Filters */}
          {availableSubjects.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Subjects</Text>
              <View style={styles.filterChipsContainer}>
                {availableSubjects.slice(0, showFilters ? availableSubjects.length : 6).map((item) => 
                  renderFilterChip({
                    item,
                    isSelected: selectedSubjects.includes(item),
                    onToggle: () => toggleSubject(item)
                  })
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found
        </Text>
        <View style={styles.sortContainer}>
          <MaterialIcons name="sort" size={16} color="#8B7355" />
          <Text style={styles.sortText}>Best Match</Text>
        </View>
      </View>

      {/* Mentors List */}
      <FlatList
        data={mentors}
        renderItem={renderMentor}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.mentorsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B4513']}
            tintColor="#8B4513"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={80} color="#E8DDD1" />
            <Text style={styles.emptyTitle}>No mentors found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search terms or clearing filters
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
              <Text style={styles.emptyButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3EE",
  },

  // Search Header
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DDD1",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#E8DDD1",
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2A2A2A",
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F8F3EE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8DDD1",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#D4AF37",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // Filters Panel
  filtersPanel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DDD1",
  },
  activeFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F3EE",
    marginBottom: 16,
  },
  activeFiltersText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B4513",
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#8B4513",
    borderRadius: 15,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A2A2A",
    marginBottom: 10,
  },
  filterChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8F3EE",
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  selectedFilterChip: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8B7355",
  },
  selectedFilterChipText: {
    color: "#FFFFFF",
  },

  // Results Header
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DDD1",
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2A2A",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    fontSize: 14,
    color: "#8B7355",
    marginLeft: 4,
  },

  // List
  mentorsList: {
    padding: 20,
    paddingBottom: 100,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8B7355",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: "#8B7355",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A2A2A",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});