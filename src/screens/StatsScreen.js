import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { villageApi, memberApi } from '../api';
import { apiCache } from '../api/cache';

export default function StatsScreen() {
  const { currentVillage, canManageVillage, isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadStats();
  }, [currentVillage?._id]);

  const loadStats = async () => {
    const vId = currentVillage?._id || '6acb0d5c63ce8027eecd8487';
    try {
      setLoading(true);
      // Fetch stats from village stats endpoint
      const res = await villageApi.getStats(vId);
      const data = (res && res.data) ? res.data : res || {};
      setStats(data);

      // Fetch all members for in-depth demographics calculation
      const mRes = await memberApi.getAll({ villageId: vId, limit: 2000 });
      const mems = Array.isArray(mRes?.data) ? mRes.data : (Array.isArray(mRes) ? mRes : []);
      setMembers(mems);
    } catch (err) {
      console.warn('Error loading stats:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRecalculate = async () => {
    if (!currentVillage?._id) return;
    try {
      setRecalculating(true);
      await villageApi.recalculate(currentVillage._id);
      await apiCache.clear();
      Alert.alert('સફળ', 'આંકડા સફળતાપૂર્વક અપડેટ થયા');
      await loadStats();
    } catch (err) {
      Alert.alert('ભૂલ', err.response?.message || 'રીકેલ્ક્યુલેટ નિષ્ફળ રહ્યું');
    } finally {
      setRecalculating(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await apiCache.clear();
    await loadStats();
  };

  // Demographics metrics calculated from members
  const demographics = React.useMemo(() => {
    const total = members.length;
    if (total === 0) {
      return {
        ageGroups: [],
        occupations: [],
        cities: [],
        marital: []
      };
    }

    // Age groups
    let age0_18 = 0;
    let age19_35 = 0;
    let age36_60 = 0;
    let age60Plus = 0;

    // Marital
    const maritalCount = {};

    // Occupations
    const occCount = {};

    // Cities
    const cityCount = {};

    members.forEach((m) => {
      const a = m.age || 0;
      if (a <= 18) age0_18++;
      else if (a <= 35) age19_35++;
      else if (a <= 60) age36_60++;
      else age60Plus++;

      const rawMarital = m.maritalStatus?.key || m.maritalStatus?.gu || (typeof m.maritalStatus === 'string' ? m.maritalStatus : '');
      const mMarital = typeof rawMarital === 'object' ? (rawMarital?.gu || rawMarital?.key || '') : String(rawMarital || '');
      if (mMarital) {
        maritalCount[mMarital] = (maritalCount[mMarital] || 0) + 1;
      }

      const rawOcc = m.occupation?.title || (typeof m.occupation === 'string' ? m.occupation : '');
      const mOcc = typeof rawOcc === 'object' ? (rawOcc?.gu || rawOcc?.en || '') : String(rawOcc || '');
      if (mOcc && mOcc.trim()) {
        const occ = mOcc.trim();
        occCount[occ] = (occCount[occ] || 0) + 1;
      }

      const rawCity = m.occupation?.workCity || m.location?.currentCity?.gu || m.address?.currentCity?.gu || (typeof m.workCity === 'string' ? m.workCity : '');
      const mCity = typeof rawCity === 'object' ? (rawCity?.gu || rawCity?.en || '') : String(rawCity || '');
      if (mCity && mCity.trim()) {
        const c = mCity.trim();
        cityCount[c] = (cityCount[c] || 0) + 1;
      }
    });

    const ageGroups = [
      { label: '૦ થી ૧૮ વર્ષ (બાળકો / યુવાનો)', count: age0_18, pct: Math.round((age0_18 / total) * 100) },
      { label: '૧૯ થી ૩૫ વર્ષ (યુવા પેઢી)', count: age19_35, pct: Math.round((age19_35 / total) * 100) },
      { label: '૩૬ થી ૬૦ વર્ષ (પ્રૌઢ)', count: age36_60, pct: Math.round((age36_60 / total) * 100) },
      { label: '૬૦+ વર્ષ (વરિષ્ઠ નાગરિક)', count: age60Plus, pct: Math.round((age60Plus / total) * 100) }
    ];

    const occupations = Object.entries(occCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));

    const cities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));

    const maritalLabels = {
      married: 'પરિણીત',
      unmarried: 'અપરિણીત',
      widow: 'વિધવા',
      widower: 'વિધુર',
      widowed: 'વિધુર / વિધવા',
      divorced: 'છૂટાછેડા'
    };

    const marital = Object.entries(maritalCount)
      .map(([key, count]) => ({
        label: maritalLabels[key] || key,
        count,
        pct: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return { ageGroups, occupations, cities, marital };
  }, [members]);

  const canManage = isSuperAdmin || canManageVillage(currentVillage?._id);

  // Stats values
  const totalFamilies = stats?.totalHouses || stats?.totalFamilies || currentVillage?.totalHouses || currentVillage?.stats?.totalFamilies || 0;
  const totalMembers = stats?.totalMembers || currentVillage?.totalMembers || currentVillage?.stats?.totalMembers || members.length;
  const maleCount = stats?.totalMale || stats?.maleCount || currentVillage?.totalMale || currentVillage?.stats?.maleCount || 0;
  const femaleCount = stats?.totalFemale || stats?.femaleCount || currentVillage?.totalFemale || currentVillage?.stats?.femaleCount || 0;
  const sexRatio = maleCount > 0 ? Math.round((femaleCount / maleCount) * 1000) : 'N/A';
  const avgFamilySize = totalFamilies > 0 ? (totalMembers / totalFamilies).toFixed(1) : 'N/A';

  const villageName = currentVillage?.name?.gu || currentVillage?.nameGujarati || (typeof currentVillage?.name === 'string' ? currentVillage?.name : 'ગામ');
  const talukaName = currentVillage?.taluka?.gu || currentVillage?.talukaGujarati || (typeof currentVillage?.taluka === 'string' ? currentVillage?.taluka : 'સમી');
  const districtName = currentVillage?.district?.gu || currentVillage?.districtGujarati || (typeof currentVillage?.district === 'string' ? currentVillage?.district : 'પાટણ');

  if (loading && !stats) {
    return (
      <View style={styles.centerLoadingContainer}>
        <ActivityIndicator size="large" color={colors.amberPrimary} style={{ marginBottom: 12 }} />
        <Text style={styles.loadingText}>આંકડાકીય માહિતી લોડ થઈ રહી છે...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberPrimary} />}
      contentContainerStyle={styles.content}
    >
      {/* Header Info */}
      <View style={styles.villageHeaderCard}>
        <View style={styles.villageHeaderLeft}>
          <Text style={styles.villageName}>
            {villageName}
          </Text>
          <Text style={styles.villageSub}>
            તાલુકો: {talukaName} • જિલ્લો: {districtName}
          </Text>
        </View>

        {canManage && (
          <TouchableOpacity
            style={styles.recalcBtn}
            onPress={handleRecalculate}
            disabled={recalculating}
          >
            {recalculating ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="sync-outline" size={14} color="#000" />
                <Text style={styles.recalcBtnText}>રીકેલ્ક્યુલેટ</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Grid of 6 Count KPI Cards */}
      <View style={styles.kpiGrid}>
        {/* Total Families */}
        <View style={[styles.kpiCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
          <View style={styles.kpiIconBoxAmber}>
            <Ionicons name="home" size={18} color={colors.amberPrimary} />
          </View>
          <Text style={styles.kpiValue}>{totalFamilies}</Text>
          <Text style={styles.kpiLabel}>કુલ ઘરો / કુટુંબ</Text>
        </View>

        {/* Total Members */}
        <View style={[styles.kpiCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <View style={styles.kpiIconBoxEmerald}>
            <Ionicons name="people" size={18} color={colors.emerald} />
          </View>
          <Text style={styles.kpiValue}>{totalMembers}</Text>
          <Text style={styles.kpiLabel}>કુલ વસ્તી</Text>
        </View>

        {/* Male */}
        <View style={[styles.kpiCard, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
          <View style={styles.kpiIconBoxBlue}>
            <Ionicons name="male" size={18} color={colors.blue} />
          </View>
          <Text style={styles.kpiValue}>{maleCount}</Text>
          <Text style={styles.kpiLabel}>પુરુષ</Text>
        </View>

        {/* Female */}
        <View style={[styles.kpiCard, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
          <View style={styles.kpiIconBoxRose}>
            <Ionicons name="female" size={18} color={colors.rose} />
          </View>
          <Text style={styles.kpiValue}>{femaleCount}</Text>
          <Text style={styles.kpiLabel}>સ્ત્રી</Text>
        </View>

        {/* Sex Ratio */}
        <View style={[styles.kpiCard, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
          <View style={styles.kpiIconBoxPurple}>
            <MaterialCommunityIcons name="scale-balance" size={18} color="#a855f7" />
          </View>
          <Text style={styles.kpiValue}>{sexRatio}</Text>
          <Text style={styles.kpiLabel}>જાતિ પ્રમાણ (૧૦૦૦ પુરુષે)</Text>
        </View>

        {/* Avg Family Size */}
        <View style={[styles.kpiCard, { borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
          <View style={styles.kpiIconBoxYellow}>
            <FontAwesome5 name="users" size={15} color="#eab308" />
          </View>
          <Text style={styles.kpiValue}>{avgFamilySize}</Text>
          <Text style={styles.kpiLabel}>સરેરાશ સભ્યો / ઘર</Text>
        </View>
      </View>

      {/* Age Distribution Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart" size={16} color={colors.amberPrimary} />
          <Text style={styles.sectionTitle}>વય જૂથ વિતરણ (Age Distribution)</Text>
        </View>

        {demographics.ageGroups.map((group, idx) => (
          <View key={idx} style={styles.barItem}>
            <View style={styles.barHeader}>
              <Text style={styles.barLabel}>{group.label}</Text>
              <Text style={styles.barCount}>{group.count} ({group.pct}%)</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min(100, group.pct)}%`, backgroundColor: colors.amberPrimary }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Top Occupations */}
      {demographics.occupations.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="briefcase-outline" size={16} color={colors.blue} />
            <Text style={styles.sectionTitle}>ટોચના વ્યવસાય (Top Occupations)</Text>
          </View>

          {demographics.occupations.map((item, idx) => (
            <View key={idx} style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{item.name}</Text>
                <Text style={styles.barCount}>{item.count} સભ્યો ({item.pct}%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, item.pct)}%`, backgroundColor: colors.blue }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Top Work Cities */}
      {demographics.cities.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={16} color={colors.emerald} />
            <Text style={styles.sectionTitle}>મુખ્ય કાર્યક્ષેત્ર / શહેરો (Cities)</Text>
          </View>

          {demographics.cities.map((item, idx) => (
            <View key={idx} style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{item.name}</Text>
                <Text style={styles.barCount}>{item.count} સભ્યો ({item.pct}%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, item.pct)}%`, backgroundColor: colors.emerald }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Marital Status */}
      {demographics.marital.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="heart-outline" size={16} color={colors.rose} />
            <Text style={styles.sectionTitle}>વૈવાહિક સ્થિતિ (Marital Status)</Text>
          </View>

          {demographics.marital.map((item, idx) => (
            <View key={idx} style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barCount}>{item.count} સભ્યો ({item.pct}%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, item.pct)}%`, backgroundColor: colors.rose }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase
  },
  content: {
    padding: 12,
    paddingBottom: 30
  },
  villageHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  villageHeaderLeft: {
    flex: 1
  },
  villageName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  villageSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3
  },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  recalcBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1
  },
  kpiIconBoxAmber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiIconBoxEmerald: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiIconBoxBlue: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiIconBoxRose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiIconBoxPurple: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiIconBoxYellow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  barItem: {
    marginBottom: 10
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  barLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  barCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: 3
  },
  centerLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bgBase
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600'
  }
});
