import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { memberApi } from '../api';
import { useAuth } from '../context/AuthContext';

export const MemberDetailModal = ({
  member,
  village,
  visible,
  onClose,
  onEdit,
  onDelete,
  onGoToFamily
}) => {
  const { user, canManageVillage } = useAuth();
  const [fullMember, setFullMember] = useState(member);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFullMember(member);
    if (member?._id && visible) {
      setLoading(true);
      memberApi.getById(member._id)
        .then(res => {
          if (res?.success && res.data) {
            setFullMember(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [member, visible]);

  if (!member || !visible) return null;

  const mem = fullMember || member;
  const isMale = mem.gender?.key === 'male';
  const villageId = mem.villageId?._id || mem.villageId || village?._id;
  const familyId = mem.familyId?._id || mem.familyId;
  const canManage = (villageId && canManageVillage(villageId)) || (user?.familyId && String(user.familyId) === String(familyId));

  const familyObj = mem.familyId && typeof mem.familyId === 'object' ? mem.familyId : null;
  const villageObj = mem.villageId && typeof mem.villageId === 'object' ? mem.villageId : village;

  const villageNameGu = villageObj?.name?.gu || 'બાસ્પા';
  const villageNameEn = villageObj?.name?.en || 'Baspa';
  const talukaGu = villageObj?.taluka?.gu || 'સમી';
  const districtGu = villageObj?.district?.gu || 'પાટણ';
  const stateGu = villageObj?.state?.gu || 'ગુજરાત';
  const pincode = villageObj?.pincode || '384245';

  const resolvedKuldevi = familyObj?.kuldevi?.gu || 'શ્રી આશાપુરા માતાજી';
  const currentCity = familyObj?.address?.currentCity?.gu || villageNameGu;
  const nativeVillage = familyObj?.address?.nativeVillage?.gu || villageNameGu;
  const streetAddress = familyObj?.address?.streetAddress || '';

  const mobile = mem.mobileNumber || '';
  const cleanMobile = mobile.replace(/\D/g, '');
  const familyMobile = familyObj?.primaryMobile || '';

  const handleCall = (num) => {
    if (!num) return;
    Linking.openURL(`tel:${num}`).catch(() => Alert.alert('Error', 'Unable to place call'));
  };

  const handleWhatsApp = (num) => {
    const clean = (num || '').replace(/\D/g, '');
    if (!clean) return;
    const phone = clean.length === 10 ? `91${clean}` : clean;
    Linking.openURL(`https://wa.me/${phone}`).catch(() => Alert.alert('Error', 'Unable to open WhatsApp'));
  };

  const handleDelete = () => {
    Alert.alert(
      'સભ્ય ડિલીટ કરો',
      `શું તમે ખરેખર "${mem.fullName?.gu || 'આ સભ્ય'}" ને ડિલીટ કરવા માંગો છો?`,
      [
        { text: 'રદ કરો', style: 'cancel' },
        {
          text: 'ડિલીટ કરો',
          style: 'destructive',
          onPress: async () => {
            try {
              await memberApi.delete(mem._id);
              if (onDelete) onDelete(mem);
              onClose();
            } catch (err) {
              Alert.alert('Error', err.response?.message || err.message || 'ડિલીટ કરવામાં ભૂલ આવી');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <LinearGradient
                colors={isMale ? COLORS.maleGradient : COLORS.femaleGradient}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {mem.fullName?.gu ? mem.fullName.gu.charAt(0) : 'સ'}
                </Text>
              </LinearGradient>

              <View style={{ marginLeft: 12, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.fullNameGu} numberOfLines={1}>
                    {mem.fullName?.gu}
                  </Text>
                  {mem.isFamilyHead && (
                    <View style={styles.headBadge}>
                      <FontAwesome5 name="crown" size={9} color={COLORS.amber} />
                      <Text style={styles.headBadgeText}>મુખ્ય</Text>
                    </View>
                  )}
                </View>
                {mem.fullName?.en ? (
                  <Text style={styles.fullNameEn} numberOfLines={1}>
                    {mem.fullName.en}
                  </Text>
                ) : null}
                <Text style={styles.subtitle}>
                  અટક: {mem.atak?.gu} • ઘર નં. {mem.houseNumber}
                  {mem.serialNumber ? ` • સળંગ #${mem.serialNumber}` : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Quick Badges */}
            <View style={styles.badgesWrap}>
              <View style={[styles.badge, isMale ? styles.badgeBlue : styles.badgeRose]}>
                <Text style={[styles.badgeText, isMale ? styles.textBlue : styles.textRose]}>
                  {mem.gender?.gu} ({isMale ? 'Male' : 'Female'})
                </Text>
              </View>

              <View style={[styles.badge, styles.badgeSlate]}>
                <Text style={styles.textSlate}>
                  ઉંમર: {mem.age !== undefined && mem.age !== null ? `${mem.age} વર્ષ` : 'અજાણ'}
                </Text>
              </View>

              <View style={[styles.badge, styles.badgeSlate]}>
                <Text style={styles.textSlate}>
                  સંબંધ: {mem.relationWithHead?.gu || 'પોતે'}
                </Text>
              </View>

              <View style={[styles.badge, styles.badgeEmerald]}>
                <Text style={styles.textEmerald}>
                  લગ્ન: {mem.maritalStatus?.gu || 'પરણિત'}
                </Text>
              </View>

              {mem.bloodGroup && (
                <View style={[styles.badge, styles.badgeRose]}>
                  <Text style={styles.textRose}>🩸 {mem.bloodGroup}</Text>
                </View>
              )}

              <View style={[styles.badge, styles.badgeAmber]}>
                <Text style={styles.textAmber}>✨ કુળદેવી: {resolvedKuldevi}</Text>
              </View>
            </View>

            {/* Section 1: Education & Occupation */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="briefcase-outline" size={16} color={COLORS.amber} />
                <Text style={styles.sectionTitle}>શિક્ષણ અને વ્યવસાય</Text>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>અભ્યાસ (Education):</Text>
                  <Text style={styles.fieldVal}>
                    {mem.education?.qualification || '-'}
                    {mem.education?.isStudying ? ' (ચાલુ)' : ''}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>વ્યવસાય (Occupation):</Text>
                  <Text style={styles.fieldVal}>
                    {mem.occupation?.title || 'ખેતી / અન્ય'}
                  </Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>કાર્યક્ષેત્ર / શહેર (Work City):</Text>
                  <Text style={[styles.fieldVal, { color: COLORS.amberLight }]}>
                    📍 {mem.occupation?.workCity || villageNameGu}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2: Contact Information */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="call-outline" size={16} color={COLORS.emeraldLight} />
                <Text style={styles.sectionTitle}>સંપર્ક વિગતો (Contact)</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.fieldLabel}>મોબાઈલ નંબર:</Text>
                {mobile ? (
                  <View style={styles.contactActionsRow}>
                    <TouchableOpacity
                      style={styles.callPill}
                      onPress={() => handleCall(mobile)}
                    >
                      <Ionicons name="call" size={14} color={COLORS.emeraldLight} />
                      <Text style={styles.callPillText}>{mobile}</Text>
                    </TouchableOpacity>

                    {cleanMobile.length >= 10 && (
                      <TouchableOpacity
                        style={styles.whatsAppPill}
                        onPress={() => handleWhatsApp(mobile)}
                      >
                        <FontAwesome5 name="whatsapp" size={14} color="#22C55E" />
                        <Text style={styles.whatsAppPillText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldVal}>-</Text>
                )}
              </View>

              {mem.email ? (
                <View style={[styles.gridItem, { marginTop: 10 }]}>
                  <Text style={styles.fieldLabel}>ઈમેલ સરનામું (Email):</Text>
                  <Text style={[styles.fieldVal, { color: COLORS.blueLight }]}>
                    ✉️ {mem.email}
                  </Text>
                </View>
              ) : null}

              {familyMobile && familyMobile !== mobile ? (
                <View style={[styles.gridItem, { marginTop: 10 }]}>
                  <Text style={styles.fieldLabel}>કુટુંબનો મુખ્ય મોબાઈલ:</Text>
                  <TouchableOpacity
                    style={styles.callPill}
                    onPress={() => handleCall(familyMobile)}
                  >
                    <Ionicons name="call" size={14} color={COLORS.emeraldLight} />
                    <Text style={styles.callPillText}>{familyMobile} (કુટુંબ)</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Section 3: Family Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="home-outline" size={16} color={COLORS.amber} />
                  <Text style={styles.sectionTitle}>કુટુંબ અને વંશ વિગત</Text>
                </View>

                {onGoToFamily && familyId ? (
                  <TouchableOpacity
                    style={styles.goToFamilyBtn}
                    onPress={() => {
                      onClose();
                      onGoToFamily(familyId);
                    }}
                  >
                    <Ionicons name="home" size={12} color={COLORS.amber} />
                    <Text style={styles.goToFamilyText}>કુટુંબ જુઓ</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>ઘર નંબર:</Text>
                  <Text style={styles.fieldVal}>#{mem.houseNumber}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>કુળદેવી:</Text>
                  <Text style={[styles.fieldVal, { color: COLORS.amberLight }]}>
                    {resolvedKuldevi}
                  </Text>
                </View>
              </View>

              {familyObj?.totalMembersCount ? (
                <View style={[styles.gridRow, { marginTop: 8 }]}>
                  <View style={styles.gridItem}>
                    <Text style={styles.fieldLabel}>કુટુંબના કુલ સભ્યો:</Text>
                    <Text style={styles.fieldVal}>{familyObj.totalMembersCount} સભ્યો</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Section 4: Village & Address */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.blueLight} />
                <Text style={styles.sectionTitle}>ગામ અને સરનામું (Address)</Text>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>ગામ:</Text>
                  <Text style={styles.fieldVal}>{villageNameGu} ({villageNameEn})</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>તાલુકો - જિલ્લો:</Text>
                  <Text style={styles.fieldVal}>તા. {talukaGu}, જિ. {districtGu}</Text>
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 8 }]}>
                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>મૂળ ગામ:</Text>
                  <Text style={styles.fieldVal}>{nativeVillage}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.fieldLabel}>હાલનું શહેર:</Text>
                  <Text style={[styles.fieldVal, { color: COLORS.amberLight }]}>📍 {currentCity}</Text>
                </View>
              </View>

              {streetAddress ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.fieldLabel}>શેરી / સરનામું:</Text>
                  <Text style={styles.fieldVal}>{streetAddress}</Text>
                </View>
              ) : null}

              <View style={{ marginTop: 8 }}>
                <Text style={styles.fieldLabel}>રાજ્ય અને પિનકોડ:</Text>
                <Text style={styles.fieldVal}>{stateGu} - {pincode}</Text>
              </View>
            </View>

            {/* Section 5: Matrimonial Details if present */}
            {mem.matrimonialProfile?.isRegistered || (mem.maritalStatus?.key === 'unmarried' && mem.matrimonialProfile?.birthDate) ? (
              <View style={[styles.sectionCard, { borderColor: 'rgba(236, 72, 153, 0.3)' }]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="heart" size={16} color={COLORS.roseLight} />
                  <Text style={[styles.sectionTitle, { color: COLORS.roseLight }]}>
                    લગ્ન વિષયક વિગત (Matrimonial)
                  </Text>
                </View>

                {mem.matrimonialProfile?.height ? (
                  <View style={styles.gridItem}>
                    <Text style={styles.fieldLabel}>ઊંચાઈ (Height):</Text>
                    <Text style={styles.fieldVal}>{mem.matrimonialProfile.height}</Text>
                  </View>
                ) : null}

                {mem.matrimonialProfile?.partnerExpectations ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.fieldLabel}>જીવનસાથી માટે અપેક્ષા:</Text>
                    <Text style={[styles.fieldVal, { fontStyle: 'italic' }]}>
                      "{mem.matrimonialProfile.partnerExpectations}"
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={styles.footer}>
            {canManage && onDelete ? (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.roseLight} />
                <Text style={styles.deleteBtnText}>ડિલીટ</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.rightFooterBtns}>
              {canManage && onEdit ? (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    onClose();
                    onEdit(mem);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#0F172A" />
                  <Text style={styles.editBtnText}>સંપાદિત કરો (Edit)</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
                <Text style={styles.closeFooterBtnText}>બંધ કરો</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800'
  },
  fullNameGu: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1
  },
  headBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amberGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.amber
  },
  headBadgeText: {
    color: COLORS.amber,
    fontSize: 10,
    fontWeight: '700'
  },
  fullNameEn: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1
  },
  subtitle: {
    color: COLORS.amber,
    fontSize: 11,
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.bgElevated
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 14
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  badgeBlue: { backgroundColor: COLORS.blueBg, borderColor: 'rgba(59, 130, 246, 0.3)' },
  badgeRose: { backgroundColor: COLORS.roseBg, borderColor: 'rgba(244, 63, 94, 0.3)' },
  badgeSlate: { backgroundColor: COLORS.bgGlass, borderColor: COLORS.border },
  badgeEmerald: { backgroundColor: COLORS.emeraldBg, borderColor: 'rgba(16, 185, 129, 0.3)' },
  badgeAmber: { backgroundColor: COLORS.amberGlow, borderColor: COLORS.borderAmber },
  badgeText: { fontSize: 11, fontWeight: '600' },
  textBlue: { color: COLORS.blueLight },
  textRose: { color: COLORS.roseLight },
  textSlate: { color: COLORS.textSecondary },
  textEmerald: { color: COLORS.emeraldLight },
  textAmber: { color: COLORS.amberLight },

  sectionCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  sectionTitleRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  goToFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amberGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderAmber
  },
  goToFamilyText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700'
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12
  },
  gridItem: {
    flex: 1
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2
  },
  fieldVal: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  callPillText: {
    color: COLORS.emeraldLight,
    fontSize: 12,
    fontWeight: '700'
  },
  whatsAppPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  whatsAppPillText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700'
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgDark
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.roseBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)'
  },
  deleteBtnText: {
    color: COLORS.roseLight,
    fontSize: 12,
    fontWeight: '700'
  },
  rightFooterBtns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amber,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  editBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700'
  },
  closeFooterBtn: {
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  closeFooterBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  }
});

export default MemberDetailModal;
