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
  Alert,
  Modal,
  Linking
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function AdminScreen() {
  const { user, isSuperAdmin, currentVillage } = useAuth();

  // Tab state: 'users' | 'sessions'
  const [activeSubTab, setActiveSubTab] = useState('users');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);

  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'super_admin' | 'village_admin' | 'member'

  // Terminating session state
  const [terminatingUserId, setTerminatingUserId] = useState(null);

  // Create User Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eligibleSearch, setEligibleSearch] = useState('');
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Set Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [adminSetPassword, setAdminSetPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSubTab, currentVillage?._id]);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    if (activeSubTab === 'users') {
      await loadUsers(forceRefresh);
    } else {
      await loadSessions(forceRefresh);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const loadUsers = async (forceRefresh = false) => {
    try {
      const params = {};
      if (!isSuperAdmin && currentVillage?._id) {
        params.villageId = currentVillage._id;
      }
      const res = await authApi.getUsers(params);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []));
      setUsersList(data);
    } catch (err) {
      console.warn('Error loading users:', err.message);
    }
  };

  const loadSessions = async (forceRefresh = false) => {
    try {
      const res = await authApi.getActiveSessions();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.sessions) ? res.sessions : (Array.isArray(res) ? res : []));
      setSessionsList(list);
      if (res?.stats) {
        setSessionStats(res.stats);
      }
    } catch (err) {
      console.warn('Error loading active sessions:', err.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Terminate session with proper User ID
  const handleTerminateSession = (targetSession) => {
    const targetUserId = targetSession._id;
    const targetName = targetSession.name || targetSession.mobileNumber || 'આ યુઝર';

    // Prevent terminating own session
    if (targetUserId === user?._id) {
      Alert.alert('ચેતવણી', 'તમે તમારું પોતાનું સક્રિય સત્ર અહીંથી સમાપ્ત કરી શકતા નથી. લોગ આઉટ કરવા માટે પ્રોફાઇલ મેનુનો ઉપયોગ કરો.');
      return;
    }

    if (!isSuperAdmin) {
      Alert.alert('પરવાનગી નથી', 'માત્ર સુપર એડમિન અન્ય સત્રો સમાપ્ત કરી શકે છે.');
      return;
    }

    Alert.alert(
      'સત્ર સમાપ્ત કરો',
      `શું તમે ખરેખર ${targetName} નું લૉગિન સેશન સમાપ્ત કરવા માંગો છો? આ યુઝર તરત જ લૉગ આઉટ થશે.`,
      [
        { text: 'ના', style: 'cancel' },
        {
          text: 'હા, સમાપ્ત કરો',
          style: 'destructive',
          onPress: async () => {
            try {
              setTerminatingUserId(targetUserId);
              const res = await authApi.terminateSession(targetUserId);
              Alert.alert('સફળ', res?.message || 'સત્ર સફળતાપૂર્વક સમાપ્ત કરવામાં આવ્યું.');
              await loadSessions(true);
            } catch (err) {
              Alert.alert('ભૂલ', err.response?.message || err.message || 'સત્ર સમાપ્ત કરવામાં નિષ્ફળતા');
            } finally {
              setTerminatingUserId(null);
            }
          }
        }
      ]
    );
  };

  // Search eligible members
  const searchEligible = async (text) => {
    setEligibleSearch(text);
    const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
    try {
      const res = await authApi.getEligibleMembers(vId, text);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.members) ? res.members : (Array.isArray(res) ? res : []));
      setEligibleMembers(data);
    } catch (err) {
      console.warn('Error searching eligible members:', err.message);
    }
  };

  // Submit Create User from Member
  const handleCreateUser = async () => {
    if (!selectedMember) {
      Alert.alert('ભૂલ', 'કૃપા કરીને સભ્ય પસંદ કરો');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('ભૂલ', 'પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ');
      return;
    }

    try {
      setSubmittingCreate(true);
      const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
      await authApi.createUserFromMember(
        selectedMember._id,
        newPassword,
        newRole,
        vId
      );
      Alert.alert('સફળ', 'વપરાશકર્તા એકાઉન્ટ સફળતાપૂર્વક બનાવવામાં આવ્યું!');
      setShowCreateModal(false);
      setSelectedMember(null);
      setNewPassword('');
      loadUsers(true);
    } catch (err) {
      Alert.alert('ભૂલ', err.response?.message || err.message || 'યુઝર બનાવી શકાયો નથી');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Submit Set Password
  const handleSetUserPassword = async () => {
    if (!adminSetPassword || adminSetPassword.length < 6) {
      Alert.alert('ભૂલ', 'પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ');
      return;
    }
    try {
      setSubmittingPassword(true);
      await authApi.setUserPassword(passwordTargetUser._id, adminSetPassword);
      Alert.alert('સફળ', 'પાસવર્ડ સફળતાપૂર્વક અપડેટ થયો!');
      setShowPasswordModal(false);
      setPasswordTargetUser(null);
      setAdminSetPassword('');
    } catch (err) {
      Alert.alert('ભૂલ', err.response?.message || err.message || 'પાસવર્ડ બદલી શકાયો નથી');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleCall = (num) => {
    if (!num) return;
    Linking.openURL(`tel:${num}`).catch(() => Alert.alert('Error', 'Unable to initiate call'));
  };

  // Helper format relative time
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'અજ્ઞાત';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 2) return 'હમણાં જ';
    if (diffMin < 60) return `${diffMin} મિનિટ પહેલા`;
    if (diffHour < 24) return `${diffHour} કલાક પહેલા`;
    return past.toLocaleDateString();
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

      // Text query
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase().trim();
      const mobile = u.mobileNumber || '';
      const nameGu = u.memberId?.fullName?.gu || u.name || '';
      const nameEn = u.memberId?.fullName?.en || '';
      const vName = u.assignedVillageId?.name?.gu || u.assignedVillageId?.name?.en || '';

      return (
        mobile.includes(q) ||
        nameGu.toLowerCase().includes(q) ||
        nameEn.toLowerCase().includes(q) ||
        vName.toLowerCase().includes(q)
      );
    });
  }, [usersList, userSearch, roleFilter]);

  // Statistics counts
  const totalUsersCount = usersList.length;
  const onlineCount = sessionStats?.onlineCount || sessionsList.filter((s) => s.isOnline).length;
  const villageAdminsCount = usersList.filter((u) => u.role === 'village_admin').length;
  const superAdminsCount = usersList.filter((u) => u.role === 'super_admin').length;

  return (
    <View style={styles.container}>
      {/* Top 4 KPI Summary Cards */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{totalUsersCount}</Text>
          <Text style={styles.kpiLabel}>કુલ યુઝર્સ</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={styles.pulseGreenDot} />
            <Text style={[styles.kpiNumber, { color: colors.emerald }]}>{onlineCount}</Text>
          </View>
          <Text style={styles.kpiLabel}>ઓનલાઈન</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
          <Text style={[styles.kpiNumber, { color: colors.blue }]}>{villageAdminsCount}</Text>
          <Text style={styles.kpiLabel}>ગામ એડમિન</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
          <Text style={[styles.kpiNumber, { color: colors.amberPrimary }]}>{superAdminsCount}</Text>
          <Text style={styles.kpiLabel}>સુપર એડમિન</Text>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeSubTab === 'users' && styles.tabItemActive]}
          onPress={() => setActiveSubTab('users')}
        >
          <Ionicons
            name="people"
            size={16}
            color={activeSubTab === 'users' ? colors.amberPrimary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeSubTab === 'users' && styles.tabTextActive]}>
            યુઝર્સ મેનેજમેન્ટ ({usersList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeSubTab === 'sessions' && styles.tabItemActive]}
          onPress={() => setActiveSubTab('sessions')}
        >
          <MaterialCommunityIcons
            name="devices"
            size={16}
            color={activeSubTab === 'sessions' ? colors.amberPrimary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeSubTab === 'sessions' && styles.tabTextActive]}>
            સક્રિય સત્રો ({sessionsList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* USERS TAB CONTENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <View style={styles.flex1}>
          {/* Search & Action Row */}
          <View style={styles.searchAndCreateRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="નામ અથવા ફોન નંબર શોધો..."
                placeholderTextColor={colors.textMuted}
                value={userSearch}
                onChangeText={setUserSearch}
              />
              {userSearch.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.createUserBtn}
              onPress={() => {
                setShowCreateModal(true);
                searchEligible('');
              }}
            >
              <Ionicons name="person-add" size={14} color="#000" />
              <Text style={styles.createUserBtnText}>+ નવો</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterChipsRow}>
            {[
              { id: 'ALL', label: 'તમામ' },
              { id: 'village_admin', label: 'ગામ એડમિન' },
              { id: 'member', label: 'સભ્યો' },
              { id: 'super_admin', label: 'સુપર એડમિન' }
            ].map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chipItem, roleFilter === chip.id && styles.chipItemActive]}
                onPress={() => setRoleFilter(chip.id)}
              >
                <Text style={[styles.chipText, roleFilter === chip.id && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Users List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={44} color={colors.textMuted} />
                  <Text style={styles.emptyText}>કોઈ વપરાશકર્તા મળ્યા નથી</Text>
                </View>
              )
            }
            renderItem={({ item }) => {
              const nameGu = item.memberId?.fullName?.gu || item.name || item.fullNameGujarati || item.mobileNumber;
              const nameEn = item.memberId?.fullName?.en || '';
              const villageName = item.assignedVillageId?.name?.gu || item.memberId?.villageId?.name?.gu || 'બાસપા';
              const houseNum = item.memberId?.houseNumber;
              const serialNum = item.memberId?.serialNumber;

              return (
                <View style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.userLeft}>
                      <View style={[
                        styles.userAvatar,
                        item.role === 'super_admin' && { borderColor: colors.amberPrimary },
                        item.role === 'village_admin' && { borderColor: colors.blue }
                      ]}>
                        <Text style={styles.userAvatarText}>
                          {(nameGu || item.mobileNumber || 'U').charAt(0)}
                        </Text>
                      </View>

                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{nameGu}</Text>
                        {nameEn && nameEn !== nameGu ? (
                          <Text style={styles.userSubName}>{nameEn}</Text>
                        ) : null}

                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
                          onPress={() => handleCall(item.mobileNumber)}
                        >
                          <Ionicons name="call" size={12} color={colors.emerald} />
                          <Text style={styles.userMobile}>{item.mobileNumber}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Role Badge */}
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'super_admin' && styles.roleSuperAdmin,
                        item.role === 'village_admin' && styles.roleVillageAdmin,
                        item.role === 'member' && styles.roleMember
                      ]}
                    >
                      <Text style={styles.roleBadgeText}>
                        {item.role === 'super_admin'
                          ? '👑 સુપર એડમિન'
                          : item.role === 'village_admin'
                          ? '🏛️ ગામ એડમિન'
                          : '👤 સભ્ય'}
                      </Text>
                    </View>
                  </View>

                  {/* Card Details Bar */}
                  <View style={styles.userCardDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <View style={styles.villageTag}>
                        <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                        <Text style={styles.villageTagText}>{villageName}</Text>
                      </View>

                      {houseNum ? (
                        <View style={styles.memberTag}>
                          <Text style={styles.memberTagText}>ઘર નં. {houseNum}</Text>
                        </View>
                      ) : null}

                      {serialNum ? (
                        <View style={styles.memberTag}>
                          <Text style={styles.memberTagText}>અનુક્રમ {serialNum}</Text>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={styles.setPasswordBtn}
                      onPress={() => {
                        setPasswordTargetUser(item);
                        setShowPasswordModal(true);
                      }}
                    >
                      <Ionicons name="key-outline" size={13} color={colors.amberPrimary} />
                      <Text style={styles.setPasswordBtnText}>પાસવર્ડ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE SESSIONS TAB CONTENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'sessions' && (
        <View style={styles.flex1}>
          <FlatList
            data={sessionsList}
            keyExtractor={(item, index) => item._id || item.sessionId || index.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="devices" size={44} color={colors.textMuted} />
                  <Text style={styles.emptyText}>કોઈ સક્રિય સત્રો મળ્યા નથી</Text>
                </View>
              )
            }
            renderItem={({ item }) => {
              const isCurrentUser = item._id === user?._id;
              const isTerminating = terminatingUserId === item._id;
              const userName = item.name || item.mobileNumber || 'વપરાશકર્તા';
              const vName = item.assignedVillage?.name?.gu || item.assignedVillage?.name?.en;

              return (
                <View style={styles.sessionCard}>
                  <View style={styles.sessionTopRow}>
                    <View style={styles.sessionLeft}>
                      <View style={styles.sessionDeviceIconBox}>
                        <MaterialCommunityIcons
                          name={item.device === 'Desktop' ? 'laptop' : 'cellphone'}
                          size={20}
                          color={item.isOnline ? colors.emerald : colors.textMuted}
                        />
                      </View>

                      <View style={styles.sessionMainInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.sessionUserName}>{userName}</Text>
                          {item.isOnline ? (
                            <View style={styles.onlineBadge}>
                              <View style={styles.greenDot} />
                              <Text style={styles.onlineText}>ઓનલાઈન</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.sessionMobileText}>📞 {item.mobileNumber}</Text>
                      </View>
                    </View>

                    {/* Role Tag */}
                    <View style={[
                      styles.roleTagSmall,
                      item.role === 'super_admin' && { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                      item.role === 'village_admin' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }
                    ]}>
                      <Text style={[
                        styles.roleTagSmallText,
                        item.role === 'super_admin' && { color: colors.amberPrimary },
                        item.role === 'village_admin' && { color: colors.blue }
                      ]}>
                        {item.role === 'super_admin' ? 'સુપર એડમિન' : item.role === 'village_admin' ? 'ગામ એડમિન' : 'સભ્ય'}
                      </Text>
                    </View>
                  </View>

                  {/* Device & Location Info */}
                  <View style={styles.sessionMetaBox}>
                    <Text style={styles.sessionMetaText}>
                      🖥️ {item.device || 'Mobile'} ({item.os || 'Android'}) • {item.browser || 'App'}
                    </Text>
                    {item.lastIpAddress ? (
                      <Text style={styles.sessionIpText}>IP: {item.lastIpAddress}</Text>
                    ) : null}
                    {vName ? (
                      <Text style={styles.sessionVillageText}>ગામ: {vName}</Text>
                    ) : null}
                  </View>

                  {/* Action & Timestamp Row */}
                  <View style={styles.sessionFooterRow}>
                    <View>
                      <Text style={styles.sessionTimeLabel}>
                        છેલ્લે સક્રિય: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{formatRelativeTime(item.lastActiveAt)}</Text>
                      </Text>
                    </View>

                    {isCurrentUser ? (
                      <View style={styles.currentSessionBadge}>
                        <Ionicons name="shield-checkmark" size={13} color={colors.emerald} />
                        <Text style={styles.currentSessionText}>વર્તમાન સેશન</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.terminateBtn}
                        onPress={() => handleTerminateSession(item)}
                        disabled={isTerminating}
                      >
                        {isTerminating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="power" size={14} color="#fff" />
                            <Text style={styles.terminateBtnText}>સેશન સમાપ્ત</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE USER FROM MEMBER */}
      {/* ========================================================================= */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>સભ્યમાંથી નવો યુઝર બનાવો</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Member search */}
            <Text style={styles.inputLabel}>સભ્ય શોધો (નામ અથવા ફોન):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="સભ્યનું નામ શોધો..."
              placeholderTextColor={colors.textMuted}
              value={eligibleSearch}
              onChangeText={searchEligible}
            />

            {/* Eligible Member Picker */}
            <View style={styles.eligibleBox}>
              <FlatList
                data={eligibleMembers}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 130 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.eligibleItem,
                      selectedMember?._id === item._id && styles.eligibleItemSelected
                    ]}
                    onPress={() => setSelectedMember(item)}
                  >
                    <Text style={styles.eligibleItemName}>
                      {item.fullName?.gu || item.fullNameGujarati || item.fullName?.en || 'N/A'}
                    </Text>
                    <Text style={styles.eligibleItemPhone}>📞 {item.mobileNumber}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {selectedMember && (
              <View style={styles.selectedBox}>
                <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
                <Text style={styles.selectedText}>
                  પસંદ કરેલ: {selectedMember.fullName?.gu || selectedMember.fullNameGujarati} ({selectedMember.mobileNumber})
                </Text>
              </View>
            )}

            {/* Password */}
            <Text style={styles.inputLabel}>પાસવર્ડ સેટ કરો:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ઓછામાં ઓછા ૬ અક્ષર..."
              placeholderTextColor={colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            {/* Role buttons */}
            <Text style={styles.inputLabel}>ભૂમિકા (Role):</Text>
            <View style={styles.rolePickerRow}>
              <TouchableOpacity
                style={[styles.roleSelectBtn, newRole === 'member' && styles.roleSelectBtnActive]}
                onPress={() => setNewRole('member')}
              >
                <Text style={[styles.roleSelectText, newRole === 'member' && styles.roleSelectTextActive]}>
                  સભ્ય
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleSelectBtn, newRole === 'village_admin' && styles.roleSelectBtnActive]}
                onPress={() => setNewRole('village_admin')}
              >
                <Text style={[styles.roleSelectText, newRole === 'village_admin' && styles.roleSelectTextActive]}>
                  ગામ એડમિન
                </Text>
              </TouchableOpacity>
              {isSuperAdmin && (
                <TouchableOpacity
                  style={[styles.roleSelectBtn, newRole === 'super_admin' && styles.roleSelectBtnActive]}
                  onPress={() => setNewRole('super_admin')}
                >
                  <Text style={[styles.roleSelectText, newRole === 'super_admin' && styles.roleSelectTextActive]}>
                    સુપર એડમિન
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleCreateUser}
              disabled={submittingCreate}
            >
              {submittingCreate ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitModalBtnText}>યુઝર બનાવો</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: SET USER PASSWORD */}
      {/* ========================================================================= */}
      <Modal visible={showPasswordModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>પાસવર્ડ બદલો</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.selectedText}>
              વપરાશકર્તા: {passwordTargetUser?.mobileNumber} ({passwordTargetUser?.memberId?.fullName?.gu || passwordTargetUser?.name || ''})
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>નવો પાસવર્ડ:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="નવો પાસવર્ડ લખો..."
              placeholderTextColor={colors.textMuted}
              value={adminSetPassword}
              onChangeText={setAdminSetPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleSetUserPassword}
              disabled={submittingPassword}
            >
              {submittingPassword ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitModalBtnText}>પાસવર્ડ સાચવો</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  pulseGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.emerald
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabItemActive: {
    borderBottomColor: colors.amberPrimary
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted
  },
  tabTextActive: {
    color: colors.amberPrimary,
    fontWeight: '700'
  },
  searchAndCreateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13
  },
  createUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    gap: 4
  },
  createUserBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000'
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6
  },
  chipItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  chipItemActive: {
    backgroundColor: colors.amberPrimary,
    borderColor: colors.amberPrimary
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '700'
  },
  listPadding: {
    paddingHorizontal: 12,
    paddingBottom: 24
  },
  userCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderMedium
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.amberPrimary
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  userSubName: {
    fontSize: 11,
    color: colors.textMuted
  },
  userMobile: {
    fontSize: 12,
    color: colors.textSecondary
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.bgElevated
  },
  roleSuperAdmin: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: colors.amberPrimary
  },
  roleVillageAdmin: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: colors.blue
  },
  roleMember: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  userCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  villageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3
  },
  villageTagText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  memberTag: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4
  },
  memberTagText: {
    fontSize: 11,
    color: colors.amberPrimary,
    fontWeight: '600'
  },
  setPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.amberPrimary,
    gap: 3
  },
  setPasswordBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.amberPrimary
  },
  sessionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  sessionDeviceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sessionMainInfo: {
    flex: 1
  },
  sessionUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald
  },
  sessionMobileText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  roleTagSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.bgElevated
  },
  roleTagSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted
  },
  sessionMetaBox: {
    backgroundColor: colors.bgElevated,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 2
  },
  sessionMetaText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  sessionIpText: {
    fontSize: 10,
    color: colors.textMuted
  },
  sessionVillageText: {
    fontSize: 10,
    color: colors.amberPrimary
  },
  sessionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  sessionTimeLabel: {
    fontSize: 11,
    color: colors.textMuted
  },
  currentSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  currentSessionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.emerald
  },
  terminateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4
  },
  terminateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderMedium
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8
  },
  modalInput: {
    backgroundColor: colors.bgBase,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  eligibleBox: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: colors.bgBase,
    overflow: 'hidden'
  },
  eligibleItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  eligibleItemSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  eligibleItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  eligibleItemPhone: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14
  },
  roleSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  roleSelectBtnActive: {
    backgroundColor: colors.amberPrimary,
    borderColor: colors.amberPrimary
  },
  roleSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted
  },
  roleSelectTextActive: {
    color: '#000',
    fontWeight: '700'
  },
  submitModalBtn: {
    backgroundColor: colors.amberPrimary,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  submitModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000'
  }
});
