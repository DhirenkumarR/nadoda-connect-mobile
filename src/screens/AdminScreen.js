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
  Alert,
  Modal
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

  const loadData = async () => {
    setLoading(true);
    if (activeSubTab === 'users') {
      await loadUsers();
    } else {
      await loadSessions();
    }
    setLoading(false);
    setRefreshing(false);
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (!isSuperAdmin && currentVillage?._id) {
        params.villageId = currentVillage._id;
      }
      const res = await authApi.getUsers(params);
      const data = res.data?.data || res.data?.users || [];
      setUsersList(data);
    } catch (err) {
      console.warn('Error loading users:', err.message);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await authApi.getActiveSessions();
      const data = res.data?.data || res.data?.sessions || [];
      setSessionsList(data);
    } catch (err) {
      console.warn('Error loading active sessions:', err.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Terminate session
  const handleTerminateSession = (sessionId) => {
    Alert.alert(
      'સત્ર સમાપ્ત કરો',
      'શું તમે ખરેખર આ સત્ર સમાપ્ત કરવા માંગો છો? યુઝર લોગ આઉટ થશે.',
      [
        { text: 'ના', style: 'cancel' },
        {
          text: 'હા, સમાપ્ત કરો',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.terminateSession(sessionId);
              Alert.alert('સફળ', 'સત્ર સફળતાપૂર્વક સમાપ્ત કરવામાં આવ્યું');
              loadSessions();
            } catch (err) {
              Alert.alert('ભૂલ', err.response?.data?.message || 'નિષ્ફળ રહ્યું');
            }
          }
        }
      ]
    );
  };

  // Search eligible members
  const searchEligible = async (text) => {
    setEligibleSearch(text);
    if (!currentVillage?._id) return;
    try {
      const res = await authApi.getEligibleMembers(currentVillage._id, text);
      const data = res.data?.data || res.data?.members || [];
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
      await authApi.createUserFromMember(
        selectedMember._id,
        newPassword,
        newRole,
        currentVillage?._id
      );
      Alert.alert('સફળ', 'નવો યુઝર સફળતાપૂર્વક બનાવવામાં આવ્યો!');
      setShowCreateModal(false);
      setSelectedMember(null);
      setNewPassword('');
      loadUsers();
    } catch (err) {
      Alert.alert('ભૂલ', err.response?.data?.message || 'યુઝર બનાવી શકાયો નથી');
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
      Alert.alert('ભૂલ', err.response?.data?.message || 'પાસવર્ડ બદલી શકાયો નથી');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
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
          <Text
            style={[styles.tabText, activeSubTab === 'users' && styles.tabTextActive]}
          >
            યુઝર્સ ({usersList.length})
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
          <Text
            style={[styles.tabText, activeSubTab === 'sessions' && styles.tabTextActive]}
          >
            સક્રિય સત્રો ({sessionsList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar for Users Tab */}
      {activeSubTab === 'users' && (
        <View style={styles.userActionBar}>
          <Text style={styles.userCountSummary}>
            કુલ વપરાશકર્તાઓ: {usersList.length}
          </Text>
          <TouchableOpacity
            style={styles.createUserBtn}
            onPress={() => {
              setShowCreateModal(true);
              searchEligible('');
            }}
          >
            <Ionicons name="person-add" size={14} color="#000" />
            <Text style={styles.createUserBtnText}>+ નવો યુઝર બનાવો</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Users List */}
      {activeSubTab === 'users' && (
        <FlatList
          data={usersList}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userCardHeader}>
                <View style={styles.userLeft}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {(item.mobileNumber || 'U').slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.memberId?.fullNameGujarati || item.memberId?.fullNameEnglish || item.mobileNumber}
                    </Text>
                    <Text style={styles.userMobile}>📞 {item.mobileNumber}</Text>
                  </View>
                </View>

                {/* Role Badge */}
                <View
                  style={[
                    styles.roleBadge,
                    item.role === 'super_admin' && styles.roleSuperAdmin,
                    item.role === 'village_admin' && styles.roleVillageAdmin
                  ]}
                >
                  <Text style={styles.roleBadgeText}>
                    {item.role === 'super_admin'
                      ? 'સુપર એડમિન'
                      : item.role === 'village_admin'
                      ? 'ગામ એડમિન'
                      : 'સભ્ય'}
                  </Text>
                </View>
              </View>

              <View style={styles.userCardFooter}>
                <Text style={styles.userVillageText}>
                  ગામ: {item.assignedVillageId?.nameGujarati || item.memberId?.villageId?.nameGujarati || 'બાસપા'}
                </Text>

                <TouchableOpacity
                  style={styles.setPasswordBtn}
                  onPress={() => {
                    setPasswordTargetUser(item);
                    setShowPasswordModal(true);
                  }}
                >
                  <Ionicons name="key-outline" size={13} color={colors.amberPrimary} />
                  <Text style={styles.setPasswordBtnText}>પાસવર્ડ બદલો</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Sessions List */}
      {activeSubTab === 'sessions' && (
        <FlatList
          data={sessionsList}
          keyExtractor={(item, index) => item.sessionId || item._id || index.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.sessionCard}>
              <View style={styles.sessionLeft}>
                <View style={styles.sessionDeviceIcon}>
                  <MaterialCommunityIcons
                    name={item.deviceType === 'mobile' ? 'cellphone' : 'laptop'}
                    size={22}
                    color={colors.amberPrimary}
                  />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionUserName}>
                    {item.user?.mobileNumber || item.userName || 'વપરાશકર્તા'}
                  </Text>
                  <Text style={styles.sessionDetails}>
                    {item.browser || item.device || 'Android / Chrome'} • IP: {item.ipAddress || '127.0.0.1'}
                  </Text>
                  <Text style={styles.sessionTime}>
                    છેલ્લે સક્રિય: {item.lastActive ? new Date(item.lastActive).toLocaleTimeString() : 'તાજેતરમાં'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.terminateBtn}
                onPress={() => handleTerminateSession(item.sessionId || item._id)}
              >
                <Ionicons name="power" size={16} color={colors.rose} />
                <Text style={styles.terminateBtnText}>સમાપ્ત</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal: Create User From Member */}
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
                      {item.fullNameGujarati || item.fullNameEnglish}
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
                  પસંદ કરેલ: {selectedMember.fullNameGujarati} ({selectedMember.mobileNumber})
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

      {/* Modal: Set User Password */}
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
              વપરાશકર્તા: {passwordTargetUser?.mobileNumber}
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
  userActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  userCountSummary: {
    fontSize: 13,
    color: colors.textMuted
  },
  createUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  createUserBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000'
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
    alignItems: 'center',
    marginBottom: 8
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
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
  userMobile: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  roleSuperAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  roleVillageAdmin: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)'
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
    marginTop: 4
  },
  userVillageText: {
    fontSize: 12,
    color: colors.textMuted
  },
  setPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  setPasswordBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amberPrimary
  },

  // Sessions
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  sessionDeviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  sessionInfo: {
    flex: 1
  },
  sessionUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  sessionDetails: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  sessionTime: {
    fontSize: 10,
    color: colors.emerald,
    marginTop: 2
  },
  terminateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4
  },
  terminateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.rose
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderMedium
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  eligibleBox: {
    backgroundColor: colors.bgSurface,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle
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
    fontWeight: '600',
    color: colors.textPrimary
  },
  eligibleItemPhone: {
    fontSize: 11,
    color: colors.textMuted
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6
  },
  selectedText: {
    fontSize: 12,
    color: colors.emerald,
    fontWeight: '600'
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  roleSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 6,
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
    color: colors.textSecondary
  },
  roleSelectTextActive: {
    color: '#000',
    fontWeight: '700'
  },
  submitModalBtn: {
    backgroundColor: colors.amberPrimary,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000'
  }
});
