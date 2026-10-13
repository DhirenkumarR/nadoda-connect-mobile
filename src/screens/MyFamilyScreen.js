import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { familyApi, memberApi } from '../api';
import MemberCard from '../components/MemberCard';

export default function MyFamilyScreen({
  onOpenMemberDetail,
  onOpenAddMember,
  onOpenEditMember,
  onOpenEditFamily
}) {
  const { user, currentVillage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);

  // Family Search & Link state (when no family is pre-linked)
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadMyFamily();
  }, [user, currentVillage?._id]);

  const loadMyFamily = async () => {
    try {
      setLoading(true);
      let familyData = null;

      // 1. Check local storage for previously pinned family ID
      const localFamId = await AsyncStorage.getItem('my_family_id');

      // 2. Check user object for linked family ID
      const userFamId = user?.familyId?._id || user?.familyId || user?.family;
      const targetFamId = userFamId || localFamId;

      if (targetFamId && typeof targetFamId === 'string') {
        try {
          const res = await familyApi.getById(targetFamId);
          familyData = res?.data?.data || res?.data || res;
        } catch (e) {
          console.warn('Could not load family by targetFamId:', e.message);
        }
      }

      // 3. If not fetched yet, call dedicated backend endpoint /families/my-family
      if (!familyData || !familyData._id) {
        try {
          const res = await familyApi.getMyFamily();
          familyData = res?.data?.data || res?.data || res;
        } catch (e) {
          console.warn('getMyFamily endpoint failed:', e.message);
        }
      }

      // 4. If still not found and user has a mobile number, search by mobile
      if ((!familyData || !familyData._id) && user?.mobileNumber) {
        try {
          const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
          const res = await familyApi.getAll({ villageId: vId, search: user.mobileNumber, limit: 1 });
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          if (list.length > 0) {
            familyData = list[0];
          }
        } catch (e) {}
      }

      // 5. Populate family and members
      if (familyData && familyData._id) {
        setFamily(familyData);
        await AsyncStorage.setItem('my_family_id', familyData._id);

        if (Array.isArray(familyData.members) && familyData.members.length > 0) {
          sortAndSetMembers(familyData.members);
        } else {
          const mRes = await memberApi.getAll({ familyId: familyData._id, limit: 100 });
          const mems = Array.isArray(mRes?.data) ? mRes.data : (Array.isArray(mRes) ? mRes : []);
          sortAndSetMembers(mems);
        }
      } else {
        setFamily(null);
        setMembers([]);
      }
    } catch (err) {
      console.warn('Error loading my family:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sortAndSetMembers = (mems) => {
    const sorted = [...mems].sort((a, b) => {
      const isHeadA = a.isHead || a.relationWithHead?.gu === 'પોતે' || a.isFamilyHead;
      const isHeadB = b.isHead || b.relationWithHead?.gu === 'પોતે' || b.isFamilyHead;
      if (isHeadA) return -1;
      if (isHeadB) return 1;
      return (b.age || 0) - (a.age || 0);
    });
    setMembers(sorted);
  };

  const handleSearchFamily = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
      const res = await familyApi.getAll({
        villageId: vId,
        search: searchQuery.trim(),
        limit: 10
      });
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setSearchResults(data);
    } catch (err) {
      Alert.alert('ભૂલ', 'કુટુંબ શોધવામાં ભૂલ આવી: ' + (err.message || 'Error'));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFamilyAsMine = async (selectedFam) => {
    try {
      setLoading(true);
      setFamily(selectedFam);
      await AsyncStorage.setItem('my_family_id', selectedFam._id);
      setSearchResults([]);
      setSearchQuery('');

      // Fetch members
      const mRes = await memberApi.getAll({ familyId: selectedFam._id, limit: 100 });
      const mems = Array.isArray(mRes?.data) ? mRes.data : (Array.isArray(mRes) ? mRes : []);
      sortAndSetMembers(mems);
    } catch (err) {
      Alert.alert('ભૂલ', 'કુટુંબ વિગતો લાવવામાં ભૂલ આવી');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkFamily = () => {
    Alert.alert(
      'કુટુંબ બદલો',
      'શું તમે પસંદ કરેલ કુટુંબ બદલવા માંગો છો?',
      [
        { text: 'રદ કરો', style: 'cancel' },
        {
          text: 'હા, બદલો',
          onPress: async () => {
            await AsyncStorage.removeItem('my_family_id');
            setFamily(null);
            setMembers([]);
            setSearchResults([]);
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyFamily();
  };

  const handleDeleteMember = (member) => {
    const name = member.fullName?.gu || member.fullName?.en || member.fullNameGujarati || 'આ સભ્ય';
    Alert.alert(
      'સભ્ય રદ કરો',
      `શું તમે ખરેખર ${name} ને રદ કરવા માંગો છો?`,
      [
        { text: 'ના', style: 'cancel' },
        {
          text: 'હા, રદ કરો',
          style: 'destructive',
          onPress: async () => {
            try {
              await memberApi.delete(member._id);
              loadMyFamily();
            } catch (err) {
              Alert.alert('ભૂલ', err.response?.message || 'રદ કરી શકાયું નથી');
            }
          }
        }
      ]
    );
  };

  // Safe field extractions
  const headGu = family?.headMemberId?.fullName?.gu || family?.headNameGujarati || family?.headMemberId?.fullName?.en || 'વડીલનું નામ દર્શાવેલ નથી';
  const headEn = family?.headMemberId?.fullName?.en || family?.headNameEnglish || '';
  const atakName = family?.atak?.gu || family?.atak?.en || (typeof family?.atak === 'string' ? family?.atak : 'અટક');
  const kuldeviName = family?.kuldevi?.gu || family?.kuldevi?.en || (typeof family?.kuldevi === 'string' ? family?.kuldevi : '');
  const addr = family?.address?.streetAddress || family?.address?.currentCity?.gu || (typeof family?.address === 'string' ? family?.address : '');
  const phone = family?.headMemberId?.mobileNumber || family?.primaryMobile || '';

  // --------------------------------------------------------------------------
  // RENDER: Empty / Search Link State
  // --------------------------------------------------------------------------
  if (!family && !loading) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome5 name="home" size={44} color={colors.amberPrimary} style={{ marginBottom: 12 }} />
        <Text style={styles.notFoundTitle}>મારું કુટુંબ પસંદ કરો</Text>
        <Text style={styles.notFoundSub}>
          તમારો મોબાઈલ નંબર, ઘર નંબર અથવા વડીલનું નામ શોધીને તમારા કુટુંબની વિગતો જુઓ અને લિંક કરો.
        </Text>

        {/* Search Input Box */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="મોબાઈલ નંબર અથવા ઘર નં. દાખલ કરો..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="default"
            onSubmitEditing={handleSearchFamily}
          />
          <TouchableOpacity
            style={styles.searchSubmitBtn}
            onPress={handleSearchFamily}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="search" size={18} color="#000" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results List */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>મળેલ કુટુંબો ({searchResults.length}):</Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => {
                const itemHead = item.headMemberId?.fullName?.gu || item.headNameGujarati || item.headMemberId?.fullName?.en || 'N/A';
                const itemAtak = item.atak?.gu || item.atak?.en || (typeof item.atak === 'string' ? item.atak : '');
                const itemPhone = item.headMemberId?.mobileNumber || item.primaryMobile || '';

                return (
                  <View style={styles.searchResultCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.resultHouseBadge}>ઘર નં. {item.houseNumber}</Text>
                        <Text style={styles.resultAtakText}>{itemAtak}</Text>
                      </View>
                      <Text style={styles.resultHeadName}>{itemHead}</Text>
                      {itemPhone ? <Text style={styles.resultPhoneText}>📞 {itemPhone}</Text> : null}
                    </View>

                    <TouchableOpacity
                      style={styles.selectFamilyBtn}
                      onPress={() => handleSelectFamilyAsMine(item)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#000" />
                      <Text style={styles.selectFamilyBtnText}>પસંદ કરો</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        )}

        <TouchableOpacity style={styles.retryBtn} onPress={loadMyFamily}>
          <Ionicons name="refresh" size={16} color="#000" />
          <Text style={styles.retryBtnText}>ફરીથી ચેક કરો</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Pinned Family View
  // --------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.amberPrimary} />
        </View>
      )}

      {/* Family Info Card */}
      <View style={styles.familyHeaderCard}>
        <View style={styles.familyTopRow}>
          <View style={styles.badgeRow}>
            <View style={styles.houseBadge}>
              <Ionicons name="home" size={13} color="#000" />
              <Text style={styles.houseBadgeText}>ઘર નં. {family?.houseNumber || 'N/A'}</Text>
            </View>
            <View style={styles.atakBadge}>
              <Text style={styles.atakBadgeText}>{atakName}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.changeFamilyBtn}
              onPress={handleUnlinkFamily}
            >
              <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
              <Text style={styles.changeFamilyBtnText}>બદલો</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editFamilyBtn}
              onPress={() => onOpenEditFamily && onOpenEditFamily(family)}
            >
              <Ionicons name="create-outline" size={15} color={colors.amberPrimary} />
              <Text style={styles.editFamilyBtnText}>સુધારો</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headLabel}>મુખ્ય વડીલ:</Text>
        <Text style={styles.headName}>{headGu}</Text>
        {headEn && headGu !== headEn && (
          <Text style={styles.headNameEnglish}>{headEn}</Text>
        )}

        {phone ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={colors.emerald} />
            <Text style={[styles.infoText, { color: colors.emerald }]}>{phone}</Text>
          </View>
        ) : null}

        {addr ? (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>{addr}</Text>
          </View>
        ) : null}

        {kuldeviName ? (
          <View style={styles.infoRow}>
            <Ionicons name="flame" size={14} color={colors.amberPrimary} />
            <Text style={styles.infoText}>કુળદેવી: {kuldeviName}</Text>
          </View>
        ) : null}

        {/* Add Member Button */}
        <TouchableOpacity
          style={styles.addMemberBtn}
          onPress={() => onOpenAddMember && onOpenAddMember(family)}
        >
          <Ionicons name="person-add" size={16} color="#000" />
          <Text style={styles.addMemberBtnText}>+ કુટુંબમાં નવો સભ્ય ઉમેરો</Text>
        </TouchableOpacity>
      </View>

      {/* Roster Title */}
      <View style={styles.rosterHeader}>
        <Text style={styles.rosterTitle}>કુટુંબના સભ્યો ({members.length})</Text>
      </View>

      {/* Members FlatList */}
      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onViewDetail={(m) => onOpenMemberDetail && onOpenMemberDetail(m)}
            onEdit={(m) => onOpenEditMember && onOpenEditMember(m)}
            onDelete={handleDeleteMember}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase
  },
  loadingOverlay: {
    position: 'absolute',
    top: 6,
    right: 14,
    zIndex: 99
  },
  familyHeaderCard: {
    backgroundColor: colors.bgCard,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium
  },
  familyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  houseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  houseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000'
  },
  atakBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  atakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  changeFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4
  },
  changeFamilyBtnText: {
    fontSize: 11,
    color: colors.textMuted
  },
  editFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.amberPrimary,
    gap: 4
  },
  editFamilyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amberPrimary
  },
  headLabel: {
    fontSize: 11,
    color: colors.textMuted
  },
  headName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  headNameEnglish: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberPrimary,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  addMemberBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000'
  },
  rosterHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  rosterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  listPadding: {
    paddingHorizontal: 12,
    paddingBottom: 24
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6
  },
  notFoundSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 16
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    width: '100%',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary
  },
  searchSubmitBtn: {
    backgroundColor: colors.amberPrimary,
    padding: 6,
    borderRadius: 6
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 14
  },
  resultsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  resultHouseBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amberPrimary
  },
  resultAtakText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  resultHeadName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2
  },
  resultPhoneText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  selectFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4
  },
  selectFamilyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000'
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    gap: 6
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  }
});
