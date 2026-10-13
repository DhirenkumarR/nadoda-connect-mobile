import React, { useState, useEffect, useMemo } from 'react';
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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { villageApi, familyApi, memberApi } from '../api';
import MemberCard from '../components/MemberCard';

export default function HierarchyScreen({
  targetFamilyId,
  clearTargetFamily,
  onOpenMemberDetail,
  onOpenAddMember,
  onOpenEditMember,
  onOpenAddFamily,
  onOpenEditFamily
}) {
  const { currentVillage, canManageVillage, isSuperAdmin } = useAuth();

  // Navigation Level: 1 = Ataks, 2 = Families, 3 = Family Roster
  const [level, setLevel] = useState(1);
  const [selectedAtak, setSelectedAtak] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);

  // Data states (Pure live data from API)
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ataksList, setAtaksList] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Search states
  const [atakSearch, setAtakSearch] = useState('');
  const [familySearch, setFamilySearch] = useState('');

  // Handle targetFamilyId jump from search or notification
  useEffect(() => {
    if (targetFamilyId) {
      jumpToFamily(targetFamilyId);
    }
  }, [targetFamilyId]);

  // Load level 1 ataks when village changes or on mount
  useEffect(() => {
    loadAtaks();
  }, [currentVillage?._id]);

  const loadAtaks = async () => {
    const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. Fetch full village details from live API
      let rawAtaks = [];
      try {
        const res = await villageApi.getById(vId);
        const vData = (res && res.data) ? res.data : res;
        if (vData?.registeredAtaks && Array.isArray(vData.registeredAtaks) && vData.registeredAtaks.length > 0) {
          rawAtaks = vData.registeredAtaks;
        }
      } catch (err1) {
        console.warn('villageApi.getById fallback to getStats:', err1.message);
      }

      // 2. Also try getStats to ensure accurate counts if available
      try {
        const statsRes = await villageApi.getStats(vId);
        const statsData = statsRes?.data || statsRes;
        if (statsData?.ataks && Array.isArray(statsData.ataks) && statsData.ataks.length > 0) {
          rawAtaks = statsData.ataks;
        }
      } catch (err2) {
        console.warn('villageApi.getStats failed:', err2.message);
      }

      // 3. Fallback: fetch families directly from API to aggregate if registeredAtaks is empty
      const atakCounts = {};
      if (rawAtaks.length === 0) {
        try {
          const famRes = await familyApi.getAll({ villageId: vId, limit: 1000 });
          const allFamilies = Array.isArray(famRes?.data) ? famRes.data : (Array.isArray(famRes) ? famRes : []);
          allFamilies.forEach(f => {
            const aName = f.atak?.gu || f.atak?.en || (typeof f.atak === 'string' ? f.atak : '');
            if (aName) {
              atakCounts[aName] = (atakCounts[aName] || 0) + 1;
            }
          });
        } catch (err3) {
          console.warn('familyApi.getAll fallback failed:', err3.message);
        }
      }

      // Map API data to standard UI objects
      const ataks = rawAtaks.map((a, idx) => {
        const guName = a.atak?.gu || a.name || (typeof a.atak === 'string' ? a.atak : '') || '';
        const enName = a.atak?.en || a.nameEn || '';
        const kuldeviGu = a.kuldevi?.gu || (typeof a.kuldevi === 'string' ? a.kuldevi : '') || '';
        return {
          _id: a._id || guName || String(idx),
          name: guName,
          nameEn: enName,
          kuldevi: kuldeviGu,
          familyCount: a.totalHouses || atakCounts[guName] || 0,
          memberCount: a.totalMembers || 0
        };
      });

      // Synthesize if rawAtaks was empty but families were returned
      if (ataks.length === 0 && Object.keys(atakCounts).length > 0) {
        Object.entries(atakCounts).forEach(([aName, count]) => {
          ataks.push({
            _id: aName,
            name: aName,
            nameEn: aName,
            kuldevi: '',
            familyCount: count,
            memberCount: 0
          });
        });
      }

      if (ataks.length === 0 && rawAtaks.length === 0 && Object.keys(atakCounts).length === 0) {
        setErrorMessage('સર્વર પરથી કોઈ અટક મળી નથી');
      }

      setAtaksList(ataks);
    } catch (err) {
      console.warn('Error loading ataks from live API:', err.message);
      setErrorMessage('સર્વર સાથે જોડાણ થઈ શક્યું નથી: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const jumpToFamily = async (famId) => {
    try {
      setLoading(true);
      const res = await familyApi.getById(famId);
      const fam = res?.data || res;
      if (fam) {
        const aName = fam.atak?.gu || fam.atak?.en || fam.atak || '';
        const kName = fam.kuldevi?.gu || fam.kuldevi?.en || fam.kuldevi || '';
        setSelectedAtak({ name: aName, kuldevi: kName });
        setSelectedFamily(fam);
        setLevel(3);
        await loadFamilyRoster(fam._id);
      }
    } catch (err) {
      Alert.alert('ભૂલ', 'કુટુંબ શોધવામાં અસમર્થ: ' + (err.response?.message || err.message));
    } finally {
      setLoading(false);
      if (clearTargetFamily) clearTargetFamily();
    }
  };

  const loadFamiliesForAtak = async (atakName) => {
    if (!atakName) return;
    const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
    try {
      setLoading(true);
      const res = await familyApi.getAll({
        villageId: vId,
        atak: atakName,
        limit: 500
      });
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setFamiliesList(data);
    } catch (err) {
      console.warn('Error loading families for atak:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFamilyRoster = async (famId) => {
    if (!famId) return;
    try {
      setLoading(true);
      // Fetch fresh family detail
      const fRes = await familyApi.getById(famId);
      const fam = fRes?.data || fRes;
      setSelectedFamily(fam);

      // Fetch all members belonging to this family
      const mRes = await memberApi.getAll({ familyId: famId, limit: 100 });
      const mems = Array.isArray(mRes?.data) ? mRes.data : (Array.isArray(mRes) ? mRes : []);
      // Sort: Head first, then by age
      mems.sort((a, b) => {
        const isHeadA = a.isHead || a.relationWithHead?.gu === 'પોતે' || a.isFamilyHead;
        const isHeadB = b.isHead || b.relationWithHead?.gu === 'પોતે' || b.isFamilyHead;
        if (isHeadA) return -1;
        if (isHeadB) return 1;
        return (b.age || 0) - (a.age || 0);
      });
      setMembersList(mems);
    } catch (err) {
      console.warn('Error loading family roster:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectAtak = (atak) => {
    setSelectedAtak(atak);
    setLevel(2);
    loadFamiliesForAtak(atak.name);
  };

  const handleSelectFamily = (fam) => {
    setSelectedFamily(fam);
    setLevel(3);
    loadFamilyRoster(fam._id);
  };

  const handleBack = () => {
    if (level === 3) {
      setLevel(2);
      setSelectedFamily(null);
      setMembersList([]);
      if (selectedAtak) {
        loadFamiliesForAtak(selectedAtak.name);
      }
    } else if (level === 2) {
      setLevel(1);
      setSelectedAtak(null);
      setFamiliesList([]);
      loadAtaks();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (level === 1) {
      loadAtaks();
    } else if (level === 2 && selectedAtak) {
      loadFamiliesForAtak(selectedAtak.name);
    } else if (level === 3 && selectedFamily) {
      loadFamilyRoster(selectedFamily._id);
    } else {
      setRefreshing(false);
    }
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
              if (selectedFamily) loadFamilyRoster(selectedFamily._id);
            } catch (err) {
              Alert.alert('ભૂલ', err.response?.message || 'રદ કરી શકાયું નથી');
            }
          }
        }
      ]
    );
  };

  // Filtered ataks
  const filteredAtaks = useMemo(() => {
    if (!atakSearch.trim()) return ataksList;
    const q = atakSearch.toLowerCase().trim();
    return ataksList.filter(a =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.nameEn && a.nameEn.toLowerCase().includes(q)) ||
      (a.kuldevi && a.kuldevi.toLowerCase().includes(q))
    );
  }, [ataksList, atakSearch]);

  // Filtered families
  const filteredFamilies = useMemo(() => {
    if (!familySearch.trim()) return familiesList;
    const q = familySearch.toLowerCase().trim();
    return familiesList.filter(f => {
      const houseStr = String(f.houseNumber || '');
      const headGu = f.headMemberId?.fullName?.gu || f.headNameGujarati || '';
      const headEn = f.headMemberId?.fullName?.en || f.headNameEnglish || '';
      const addr = f.address?.streetAddress || f.address?.currentCity?.gu || (typeof f.address === 'string' ? f.address : '');

      return (
        houseStr.includes(q) ||
        headGu.toLowerCase().includes(q) ||
        headEn.toLowerCase().includes(q) ||
        addr.toLowerCase().includes(q)
      );
    });
  }, [familiesList, familySearch]);

  const canManage = isSuperAdmin || canManageVillage(currentVillage?._id);

  // --------------------------------------------------------------------------
  // RENDER LEVEL 1: ATAKS
  // --------------------------------------------------------------------------
  const renderLevel1 = () => (
    <View style={styles.flex1}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="અટક અથવા કુળદેવી શોધો..."
          placeholderTextColor={colors.textMuted}
          value={atakSearch}
          onChangeText={setAtakSearch}
        />
        {atakSearch.length > 0 && (
          <TouchableOpacity onPress={() => setAtakSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {currentVillage?.name?.gu || currentVillage?.nameGujarati || 'ગામ'} ની તમામ અટક ({filteredAtaks.length})
        </Text>
        <Text style={styles.sectionSubtitle}>અટક પર ક્લિક કરીને કુટુંબો જુઓ</Text>
      </View>

      <FlatList
        data={filteredAtaks}
        keyExtractor={(item, index) => item._id || item.name || index.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>સર્વર પરથી માહિતી લોડ થઈ રહી છે...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.rosePrimary || '#f43f5e'} />
              <Text style={[styles.emptyText, { color: '#f43f5e', textAlign: 'center', marginHorizontal: 20 }]}>
                {errorMessage}
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadAtaks}>
                <Ionicons name="refresh" size={16} color="#000" />
                <Text style={styles.retryBtnText}>ફરી પ્રયાસ કરો</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="git-network-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>કોઈ અટક મળી નથી</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.atakCard}
            activeOpacity={0.7}
            onPress={() => handleSelectAtak(item)}
          >
            <View style={styles.atakLeft}>
              <View style={styles.atakIconBadge}>
                <Text style={styles.atakIconText}>
                  {item.name ? item.name.charAt(0) : 'અ'}
                </Text>
              </View>
              <View style={styles.atakInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.atakName}>{item.name}</Text>
                  {item.nameEn ? (
                    <Text style={styles.atakNameEn}>({item.nameEn})</Text>
                  ) : null}
                </View>
                {item.kuldevi ? (
                  <View style={styles.kuldeviRow}>
                    <Ionicons name="flame" size={12} color={colors.amberPrimary} />
                    <Text style={styles.kuldeviText}>કુળદેવી: {item.kuldevi}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.atakRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.familyCount || 0} કુટુંબ</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // --------------------------------------------------------------------------
  // RENDER LEVEL 2: FAMILIES
  // --------------------------------------------------------------------------
  const renderLevel2 = () => (
    <View style={styles.flex1}>
      {/* Breadcrumb Navigation Bar */}
      <View style={styles.breadcrumbBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-back" size={20} color={colors.amberPrimary} />
          <Text style={styles.backBtnText}>ગામ</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbDivider}>/</Text>
        <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
          અટક: {selectedAtak?.name} {selectedAtak?.nameEn ? `(${selectedAtak.nameEn})` : ''}
        </Text>
      </View>

      {/* Search and Action Bar */}
      <View style={styles.searchAndActionRow}>
        <View style={[styles.searchContainer, { flex: 1, marginBottom: 0 }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ઘર નં, વડીલનું નામ કે સરનામું..."
            placeholderTextColor={colors.textMuted}
            value={familySearch}
            onChangeText={setFamilySearch}
          />
          {familySearch.length > 0 && (
            <TouchableOpacity onPress={() => setFamilySearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {canManage && (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => onOpenAddFamily && onOpenAddFamily(selectedAtak?.name)}
          >
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.primaryActionBtnText}>કુટુંબ</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countSummaryRow}>
        <Text style={styles.countSummaryText}>
          કુલ કુટુંબો: {filteredFamilies.length}
        </Text>
        {selectedAtak?.kuldevi && (
          <Text style={styles.kuldeviSmallText}>
            કુળદેવી: {selectedAtak.kuldevi}
          </Text>
        )}
      </View>

      <FlatList
        data={filteredFamilies}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>કુટુંબો લોડ થઈ રહ્યા છે...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="users" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>આ અટકમાં કોઈ કુટુંબ મળ્યું નથી</Text>
              {canManage && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => onOpenAddFamily && onOpenAddFamily(selectedAtak?.name)}
                >
                  <Text style={styles.emptyAddBtnText}>+ પ્રથમ કુટુંબ ઉમેરો</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const headGu = item.headMemberId?.fullName?.gu || item.headNameGujarati || 'વડીલનું નામ દર્શાવેલ નથી';
          const headEn = item.headMemberId?.fullName?.en || item.headNameEnglish;
          const phone = item.headMemberId?.mobileNumber || item.primaryMobile || item.mobileNumber;
          const addr = item.address?.streetAddress || item.address?.currentCity?.gu || (typeof item.address === 'string' ? item.address : '');

          return (
            <TouchableOpacity
              style={styles.familyCard}
              activeOpacity={0.7}
              onPress={() => handleSelectFamily(item)}
            >
              <View style={styles.familyCardHeader}>
                <View style={styles.familyHouseBadge}>
                  <Ionicons name="home-outline" size={13} color={colors.amberPrimary} />
                  <Text style={styles.familyHouseText}>ઘર નં. {item.houseNumber || 'N/A'}</Text>
                </View>
                <View style={styles.familyMemberCountBadge}>
                  <Ionicons name="people-outline" size={12} color={colors.emerald} />
                  <Text style={styles.familyMemberCountText}>
                    {item.totalMembersCount || (item.members && item.members.length) || 0} સભ્યો
                  </Text>
                </View>
              </View>

              <View style={styles.familyCardBody}>
                <Text style={styles.familyHeadName}>{headGu}</Text>
                {headEn && headGu !== headEn && (
                  <Text style={styles.familyHeadSub}>{headEn}</Text>
                )}

                {addr ? (
                  <View style={styles.familyInfoRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.familyInfoText} numberOfLines={1}>{addr}</Text>
                  </View>
                ) : null}

                {phone ? (
                  <View style={styles.familyInfoRow}>
                    <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.familyInfoText}>{phone}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.familyCardFooter}>
                <Text style={styles.viewRosterPrompt}>સભ્યોની યાદી જુઓ</Text>
                <Ionicons name="arrow-forward-circle" size={18} color={colors.amberPrimary} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // --------------------------------------------------------------------------
  // RENDER LEVEL 3: FAMILY ROSTER
  // --------------------------------------------------------------------------
  const renderLevel3 = () => {
    const headGu = selectedFamily?.headMemberId?.fullName?.gu || selectedFamily?.headNameGujarati || 'N/A';
    const atakName = selectedFamily?.atak?.gu || selectedFamily?.atak || selectedAtak?.name || '';
    const kuldeviName = selectedFamily?.kuldevi?.gu || selectedFamily?.kuldevi || selectedAtak?.kuldevi || '';
    const addr = selectedFamily?.address?.streetAddress || selectedFamily?.address?.currentCity?.gu || (typeof selectedFamily?.address === 'string' ? selectedFamily?.address : '');

    return (
      <View style={styles.flex1}>
        {/* Breadcrumb Navigation Bar */}
        <View style={styles.breadcrumbBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="chevron-back" size={20} color={colors.amberPrimary} />
            <Text style={styles.backBtnText}>{selectedAtak?.name || 'કુટુંબો'}</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            ઘર નં. {selectedFamily?.houseNumber || 'કુટુંબ'}
          </Text>
        </View>

        {/* Family Summary Banner Card */}
        <View style={styles.rosterBannerCard}>
          <View style={styles.rosterBannerHeader}>
            <View style={styles.rosterBannerLeft}>
              <View style={styles.rosterHouseBadge}>
                <Ionicons name="home" size={14} color="#000" />
                <Text style={styles.rosterHouseText}>ઘર નં. {selectedFamily?.houseNumber || 'N/A'}</Text>
              </View>
              <Text style={styles.rosterAtakName}>{atakName}</Text>
            </View>

            {canManage && (
              <TouchableOpacity
                style={styles.editFamilyBtn}
                onPress={() => onOpenEditFamily && onOpenEditFamily(selectedFamily)}
              >
                <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.editFamilyBtnText}>કુટુંબ સુધારો</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rosterBannerDetails}>
            <Text style={styles.rosterHeadTitle}>મુખ્ય વડીલ:</Text>
            <Text style={styles.rosterHeadValue}>{headGu}</Text>

            {addr ? (
              <View style={styles.rosterDetailRow}>
                <Ionicons name="location-sharp" size={13} color={colors.textMuted} />
                <Text style={styles.rosterDetailText}>{addr}</Text>
              </View>
            ) : null}

            {kuldeviName ? (
              <View style={styles.rosterDetailRow}>
                <Ionicons name="flame" size={13} color={colors.amberPrimary} />
                <Text style={styles.rosterDetailText}>કુળદેવી: {kuldeviName}</Text>
              </View>
            ) : null}
          </View>

          {/* Action Button: Add Member */}
          {canManage && (
            <TouchableOpacity
              style={styles.addMemberToFamilyBtn}
              onPress={() => onOpenAddMember && onOpenAddMember(selectedFamily)}
            >
              <Ionicons name="person-add" size={16} color="#000" />
              <Text style={styles.addMemberToFamilyBtnText}>+ નવો સભ્ય ઉમેરો</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rosterSectionHeader}>
          <Text style={styles.rosterSectionTitle}>
            કુટુંબના તમામ સભ્યો ({membersList.length})
          </Text>
        </View>

        <FlatList
          data={membersList}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>સભ્યો લોડ થઈ રહ્યા છે...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyText}>આ કુટુંબમાં હજુ કોઈ સભ્ય નોંધાયેલ નથી</Text>
                {canManage && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => onOpenAddMember && onOpenAddMember(selectedFamily)}
                  >
                    <Text style={styles.emptyAddBtnText}>+ સભ્ય ઉમેરો</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              onViewDetail={(m) => onOpenMemberDetail && onOpenMemberDetail(m)}
              onEdit={canManage ? (m) => onOpenEditMember && onOpenEditMember(m) : null}
              onDelete={canManage ? handleDeleteMember : null}
            />
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.amberPrimary} />
        </View>
      )}

      {level === 1 && (
        loading && ataksList.length === 0 ? (
          <View style={styles.centerLoadingContainer}>
            <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
            <Text style={styles.loadingText}>સર્વર પરથી અટક લોડ થઈ રહી છે...</Text>
          </View>
        ) : renderLevel1()
      )}

      {level === 2 && (
        loading && familiesList.length === 0 ? (
          <View style={styles.centerLoadingContainer}>
            <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
            <Text style={styles.loadingText}>કુટુંબો લોડ થઈ રહ્યા છે...</Text>
          </View>
        ) : renderLevel2()
      )}

      {level === 3 && (
        loading && membersList.length === 0 ? (
          <View style={styles.centerLoadingContainer}>
            <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
            <Text style={styles.loadingText}>સભ્યો લોડ થઈ રહ્યા છે...</Text>
          </View>
        ) : renderLevel3()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase
  },
  flex1: {
    flex: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: 6,
    right: 14,
    zIndex: 99
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
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
    fontSize: 14
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  listPadding: {
    paddingHorizontal: 12,
    paddingBottom: 24
  },
  atakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  atakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  atakIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  atakIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.amberPrimary
  },
  atakInfo: {
    flex: 1
  },
  atakName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  atakNameEn: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500'
  },
  kuldeviRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4
  },
  kuldeviText: {
    fontSize: 12,
    color: colors.amberLight
  },
  atakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  badgeContainer: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },

  // Level 2 Styles
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amberPrimary
  },
  breadcrumbDivider: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 8
  },
  breadcrumbCurrent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  },
  searchAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000'
  },
  countSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  countSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted
  },
  kuldeviSmallText: {
    fontSize: 12,
    color: colors.amberLight
  },
  familyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  familyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  familyHouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5
  },
  familyHouseText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amberPrimary
  },
  familyMemberCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4
  },
  familyMemberCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald
  },
  familyCardBody: {
    marginBottom: 10
  },
  familyHeadName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  familyHeadSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1
  },
  familyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6
  },
  familyInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1
  },
  familyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
    marginTop: 4
  },
  viewRosterPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amberPrimary
  },

  // Level 3 Roster Styles
  rosterBannerCard: {
    backgroundColor: colors.bgCard,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium
  },
  rosterBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  rosterBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rosterHouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4
  },
  rosterHouseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000'
  },
  rosterAtakName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  editFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  editFamilyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary
  },
  rosterBannerDetails: {
    backgroundColor: colors.bgSurface,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  rosterHeadTitle: {
    fontSize: 11,
    color: colors.textMuted
  },
  rosterHeadValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    marginBottom: 4
  },
  rosterDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6
  },
  rosterDetailText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  addMemberToFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberPrimary,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6
  },
  addMemberToFamilyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000'
  },
  rosterSectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  rosterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 10
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000'
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
    gap: 6
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000'
  },
  centerLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600'
  }
});
