import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadMyFamily();
  }, [user]);

  const loadMyFamily = async () => {
    try {
      setLoading(true);
      let familyData = null;

      // First check if user object has familyId
      const famId = user?.familyId?._id || user?.familyId || user?.family;
      if (famId && typeof famId === 'string') {
        try {
          const res = await familyApi.getById(famId);
          familyData = res.data?.data || res.data;
        } catch (e) {
          console.warn('Could not load family by ID, trying getMyFamily endpoint');
        }
      }

      // If not fetched, try /families/my-family
      if (!familyData) {
        try {
          const res = await familyApi.getMyFamily();
          familyData = res.data?.data || res.data;
        } catch (e) {
          console.warn('getMyFamily endpoint failed:', e.message);
        }
      }

      if (familyData && familyData._id) {
        setFamily(familyData);
        // Load members for this family
        const mRes = await memberApi.getAll({ familyId: familyData._id, limit: 100 });
        const mems = mRes.data?.data || mRes.data?.members || [];
        mems.sort((a, b) => {
          if (a.isHead) return -1;
          if (b.isHead) return 1;
          return (b.age || 0) - (a.age || 0);
        });
        setMembers(mems);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadMyFamily();
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
              loadMyFamily();
            } catch (err) {
              Alert.alert('ભૂલ', err.response?.data?.message || 'રદ કરી શકાયું નથી');
            }
          }
        }
      ]
    );
  };

  if (!family && !loading) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome5 name="home" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>મારું કુટુંબ મળ્યું નથી</Text>
        <Text style={styles.notFoundSub}>
          તમારું એકાઉન્ટ કોઈ કુટુંબ સાથે જોડાયેલ નથી અથવા કુટુંબ આઈડી સેટ નથી. એડમિનનો સંપર્ક કરો.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadMyFamily}>
          <Ionicons name="refresh" size={16} color="#000" />
          <Text style={styles.retryBtnText}>ફરીથી પ્રયાસ કરો</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              <Text style={styles.atakBadgeText}>{family?.atak || 'અટક'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editFamilyBtn}
            onPress={() => onOpenEditFamily && onOpenEditFamily(family)}
          >
            <Ionicons name="create-outline" size={15} color={colors.amberPrimary} />
            <Text style={styles.editFamilyBtnText}>સુધારો</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headLabel}>મુખ્ય વડીલ:</Text>
        <Text style={styles.headName}>
          {family?.headNameGujarati || family?.headNameEnglish || 'N/A'}
        </Text>
        {family?.headNameEnglish && family?.headNameGujarati && (
          <Text style={styles.headNameEnglish}>{family?.headNameEnglish}</Text>
        )}

        {family?.address ? (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>{family.address}</Text>
          </View>
        ) : null}

        {family?.kuldevi ? (
          <View style={styles.infoRow}>
            <Ionicons name="flame" size={14} color={colors.amberPrimary} />
            <Text style={styles.infoText}>કુળદેવી: {family.kuldevi}</Text>
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
    padding: 24
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14
  },
  notFoundSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 16,
    gap: 6
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000'
  }
});
