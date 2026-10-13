import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { memberApi, villageApi } from '../api';
import MemberCard from '../components/MemberCard';

export default function MembersScreen({
  onOpenMemberDetail,
  onOpenAddMember,
  onOpenEditMember,
  onJumpToFamily
}) {
  const { currentVillage, canManageVillage, isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [ataksList, setAtaksList] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAtak, setSelectedAtak] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL'); // 'ALL' | 'male' | 'female'
  const [onlyHeads, setOnlyHeads] = useState(false);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState('ALL');

  useEffect(() => {
    if (currentVillage?._id) {
      loadMembers();
      loadAtaks();
    }
  }, [currentVillage?._id]);

  const loadMembers = async () => {
    if (!currentVillage?._id) return;
    try {
      setLoading(true);
      const res = await memberApi.getAll({
        villageId: currentVillage._id,
        limit: 1500
      });
      const data = res.data?.data || res.data?.members || [];
      setAllMembers(data);
    } catch (err) {
      console.warn('Error loading members:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAtaks = async () => {
    if (!currentVillage?._id) return;
    try {
      const res = await villageApi.getById(currentVillage._id);
      const vData = res.data?.data || res.data || {};
      const ataks = (vData.ataks || []).map(a => a.name).filter(Boolean);
      setAtaksList(ataks);
    } catch (err) {
      console.warn('Error loading ataks:', err.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleDeleteMember = (member) => {
    Alert.alert(
      'સભ્ય રદ કરો',
      `શું તમે ખરેખર ${member.fullNameGujarati || member.fullNameEnglish} ને રદ કરવા માંગો છો?`,
      [
        { text: 'ના', style: 'cancel' },
        {
          text: 'હા, રદ કરો',
          style: 'destructive',
          onPress: async () => {
            try {
              await memberApi.delete(member._id);
              loadMembers();
            } catch (err) {
              Alert.alert('ભૂલ', err.response?.data?.message || 'રદ કરી શકાયું નથી');
            }
          }
        }
      ]
    );
  };

  // Filtered members with memoization for snappy performance
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      // Village filter
      if (currentVillage?._id && m.villageId) {
        const vId = typeof m.villageId === 'object' ? m.villageId._id : m.villageId;
        if (vId !== currentVillage._id) return false;
      }

      // Atak filter
      if (selectedAtak !== 'ALL') {
        const mAtak = m.familyId?.atak || m.atak;
        if (mAtak !== selectedAtak) return false;
      }

      // Gender filter
      if (selectedGender !== 'ALL') {
        if (m.gender !== selectedGender) return false;
      }

      // Only heads filter
      if (onlyHeads && !m.isHead) {
        return false;
      }

      // Marital status filter
      if (selectedMaritalStatus !== 'ALL') {
        if (m.maritalStatus !== selectedMaritalStatus) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullGuj = (m.fullNameGujarati || '').toLowerCase();
        const fullEng = (m.fullNameEnglish || '').toLowerCase();
        const phone = (m.mobileNumber || '').toLowerCase();
        const job = (m.occupation || '').toLowerCase();
        const city = (m.workCity || '').toLowerCase();
        const mAtak = (m.familyId?.atak || m.atak || '').toLowerCase();
        const house = (m.familyId?.houseNumber || '').toLowerCase();

        return (
          fullGuj.includes(q) ||
          fullEng.includes(q) ||
          phone.includes(q) ||
          job.includes(q) ||
          city.includes(q) ||
          mAtak.includes(q) ||
          house.includes(q)
        );
      }

      return true;
    });
  }, [allMembers, currentVillage?._id, selectedAtak, selectedGender, onlyHeads, selectedMaritalStatus, searchQuery]);

  const canManage = isSuperAdmin || canManageVillage(currentVillage?._id);

  // Render individual item
  const renderItem = useCallback(({ item }) => (
    <MemberCard
      member={item}
      onViewDetail={(m) => onOpenMemberDetail && onOpenMemberDetail(m)}
      onJumpToFamily={(famId) => onJumpToFamily && onJumpToFamily(famId)}
      onEdit={canManage ? (m) => onOpenEditMember && onOpenEditMember(m) : null}
      onDelete={canManage ? handleDeleteMember : null}
    />
  ), [canManage, onOpenMemberDetail, onJumpToFamily, onOpenEditMember]);

  return (
    <View style={styles.container}>
      {/* Header Search & Add Row */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="નામ, મોબાઈલ, અટક, નોકરી કે શહેર શોધો..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {canManage && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onOpenAddMember && onOpenAddMember()}
          >
            <Ionicons name="person-add" size={16} color="#000" />
            <Text style={styles.addBtnText}>સભ્ય</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Horizontal Scroll View */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* Gender Pills */}
          <TouchableOpacity
            style={[styles.filterChip, selectedGender === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedGender('ALL')}
          >
            <Text style={[styles.filterChipText, selectedGender === 'ALL' && styles.filterChipTextActive]}>
              બધા
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedGender === 'male' && styles.filterChipActive]}
            onPress={() => setSelectedGender(selectedGender === 'male' ? 'ALL' : 'male')}
          >
            <Ionicons name="male" size={13} color={selectedGender === 'male' ? '#000' : colors.blue} />
            <Text style={[styles.filterChipText, selectedGender === 'male' && styles.filterChipTextActive]}>
              પુરુષ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedGender === 'female' && styles.filterChipActive]}
            onPress={() => setSelectedGender(selectedGender === 'female' ? 'ALL' : 'female')}
          >
            <Ionicons name="female" size={13} color={selectedGender === 'female' ? '#000' : colors.rose} />
            <Text style={[styles.filterChipText, selectedGender === 'female' && styles.filterChipTextActive]}>
              સ્ત્રી
            </Text>
          </TouchableOpacity>

          {/* Head Toggle Chip */}
          <TouchableOpacity
            style={[styles.filterChip, onlyHeads && styles.filterChipActiveAmber]}
            onPress={() => setOnlyHeads(!onlyHeads)}
          >
            <FontAwesome5 name="crown" size={11} color={onlyHeads ? '#000' : colors.amberPrimary} />
            <Text style={[styles.filterChipText, onlyHeads && styles.filterChipTextDark]}>
              વડીલ માત્ર
            </Text>
          </TouchableOpacity>

          {/* Atak Filter dropdown/chips */}
          {ataksList.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.filterChip, selectedAtak === a && styles.filterChipActive]}
              onPress={() => setSelectedAtak(selectedAtak === a ? 'ALL' : a)}
            >
              <Text style={[styles.filterChipText, selectedAtak === a && styles.filterChipTextActive]}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Count & Status Row */}
      <View style={styles.statusBar}>
        <Text style={styles.statusCountText}>
          કુલ સભ્યો: <Text style={styles.statusCountBold}>{filteredMembers.length}</Text>
        </Text>
        {(selectedAtak !== 'ALL' || selectedGender !== 'ALL' || onlyHeads || searchQuery) && (
          <TouchableOpacity
            style={styles.clearFiltersBtn}
            onPress={() => {
              setSearchQuery('');
              setSelectedAtak('ALL');
              setSelectedGender('ALL');
              setOnlyHeads(false);
              setSelectedMaritalStatus('ALL');
            }}
          >
            <Text style={styles.clearFiltersText}>ફિલ્ટર સાફ કરો</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Member FlatList */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
        contentContainerStyle={styles.listPadding}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>કોઈ સભ્ય મળ્યા નથી</Text>
              <Text style={styles.emptySubtitle}>
                શોધ શબ્દ અથવા પસંદ કરેલ ફિલ્ટર બદલીને ફરી પ્રયાસ કરો
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000'
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4
  },
  filterChipActive: {
    backgroundColor: colors.amberPrimary,
    borderColor: colors.amberPrimary
  },
  filterChipActiveAmber: {
    backgroundColor: colors.amberPrimary,
    borderColor: colors.amberPrimary
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: '700'
  },
  filterChipTextDark: {
    color: '#000',
    fontWeight: '700'
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  statusCountText: {
    fontSize: 13,
    color: colors.textMuted
  },
  statusCountBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  clearFiltersBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  clearFiltersText: {
    fontSize: 12,
    color: colors.amberPrimary,
    fontWeight: '600'
  },
  listPadding: {
    paddingHorizontal: 12,
    paddingBottom: 24
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6
  }
});
