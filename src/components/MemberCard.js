import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

export const MemberCard = ({
  member,
  onSelectMember,
  onViewDetail,
  onGoToFamily,
  onJumpToFamily,
  onEditMember,
  onEdit,
  onDeleteMember,
  onDelete,
  canManage = false
}) => {
  if (!member) return null;

  const isMale = member.gender?.key === 'male' || member.gender === 'male';
  const fullNameGu = member.fullName?.gu || member.fullNameGujarati || (typeof member.fullName === 'string' ? member.fullName : '') || '';
  const fullNameEn = member.fullName?.en || member.fullNameEnglish || '';
  const mobile = member.mobileNumber || member.contact?.mobileNumber || '';
  const cleanMobile = mobile.replace(/\D/g, '');
  const isHead = Boolean(member.isFamilyHead || member.isHead);
  const atakGu = member.atak?.gu || (typeof member.atak === 'string' ? member.atak : '') || member.familyId?.atak?.gu || member.familyId?.atak || '';
  const atakEn = member.atak?.en || member.familyId?.atak?.en || '';
  const houseNum = member.houseNumber || member.familyId?.houseNumber || '';

  const handleSelect = () => {
    if (onViewDetail) onViewDetail(member);
    else if (onSelectMember) onSelectMember(member);
  };

  const handleFamilyJump = () => {
    const fId = member.familyId?._id || member.familyId;
    if (onJumpToFamily) onJumpToFamily(fId);
    else if (onGoToFamily) onGoToFamily(fId);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(member);
    else if (onEditMember) onEditMember(member);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(member);
    else if (onDeleteMember) onDeleteMember(member);
  };

  const handleCall = () => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call');
    });
  };

  const handleWhatsApp = () => {
    if (!cleanMobile) return;
    const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    Linking.openURL(`https://wa.me/${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp');
    });
  };

  const familyId = member.familyId?._id || member.familyId;

  return (
    <View style={styles.card}>
      {/* Top Card Row */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={isMale ? COLORS.maleGradient : COLORS.femaleGradient}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarLetter}>
              {fullNameGu ? fullNameGu.charAt(0) : 'સ'}
            </Text>
          </LinearGradient>

          {member.isFamilyHead && (
            <View style={styles.headCrownBadge}>
              <FontAwesome5 name="crown" size={9} color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.infoWrapper}>
          <View style={styles.nameRow}>
            <Text style={styles.fullNameGu} numberOfLines={1}>
              {fullNameGu}
            </Text>
            {member.isFamilyHead && (
              <View style={styles.headBadge}>
                <Text style={styles.headBadgeText}>મુખ્ય</Text>
              </View>
            )}
          </View>

          {fullNameEn ? (
            <Text style={styles.fullNameEn} numberOfLines={1}>
              {fullNameEn}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.atakText}>
              અટક: {member.atak?.gu || ''} {member.atak?.en ? `(${member.atak.en})` : ''}
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.houseText}>
              ઘર નં. {member.houseNumber}
            </Text>
            {member.serialNumber ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.serialText}>#{member.serialNumber}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* Badges / Pill Tags */}
      <View style={styles.badgesContainer}>
        <View style={[styles.badge, isMale ? styles.badgeBlue : styles.badgeRose]}>
          <Text style={[styles.badgeText, isMale ? styles.textBlue : styles.textRose]}>
            {member.gender?.gu || (isMale ? 'પુરુષ' : 'સ્ત્રી')} • {member.age ? `${member.age} વ.` : ''}
          </Text>
        </View>

        <View style={[styles.badge, styles.badgeSlate]}>
          <Text style={styles.textSlate}>
            સંબંધ: {member.relationWithHead?.gu || 'પોતે'}
          </Text>
        </View>

        {member.maritalStatus?.gu && (
          <View style={[styles.badge, styles.badgeEmerald]}>
            <Text style={styles.textEmerald}>
              {member.maritalStatus.gu}
            </Text>
          </View>
        )}

        {member.education?.qualification && (
          <View style={[styles.badge, styles.badgeSlate]}>
            <Text style={styles.textSlate}>
              🎓 {member.education.qualification}
              {member.education?.isStudying ? ' (ચાલુ)' : ''}
            </Text>
          </View>
        )}

        {member.occupation?.title && (
          <View style={[styles.badge, styles.badgeAmber]}>
            <Text style={styles.textAmber}>
              💼 {member.occupation.title}
              {member.occupation?.workCity ? ` (📍 ${member.occupation.workCity})` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Direct Contact Buttons if mobile present */}
      {mobile ? (
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={13} color={COLORS.emeraldLight} />
            <Text style={styles.callBtnText}>{mobile}</Text>
          </TouchableOpacity>

          {cleanMobile.length >= 10 && (
            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleWhatsApp}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="whatsapp" size={14} color="#22C55E" />
              <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Card Footer Actions */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={handleSelect}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={13} color={COLORS.textPrimary} />
          <Text style={styles.profileBtnText}>વિગત જુઓ (Profile)</Text>
        </TouchableOpacity>

        {(onJumpToFamily || onGoToFamily) && familyId ? (
          <TouchableOpacity
            style={styles.familyBtn}
            onPress={handleFamilyJump}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={13} color={COLORS.amber} />
            <Text style={styles.familyBtnText}>કુટુંબ જુઓ</Text>
          </TouchableOpacity>
        ) : null}

        {(canManage || onEdit || onEditMember || onDelete || onDeleteMember) ? (
          <View style={styles.adminActionIcons}>
            {(onEdit || onEditMember) && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.amber} />
              </TouchableOpacity>
            )}
            {(onDelete || onDeleteMember) && (
              <TouchableOpacity
                style={[styles.iconBtn, styles.deleteIconBtn]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.roseLight} />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800'
  },
  headCrownBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.amber,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.bgDark
  },
  infoWrapper: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  fullNameGu: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1
  },
  headBadge: {
    backgroundColor: COLORS.amberGlow,
    borderWidth: 1,
    borderColor: COLORS.amber,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  headBadgeText: {
    color: COLORS.amber,
    fontSize: 9,
    fontWeight: '700'
  },
  fullNameEn: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  atakText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '600'
  },
  houseText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600'
  },
  serialText: {
    color: COLORS.textSecondary,
    fontSize: 11
  },
  dotSeparator: {
    color: COLORS.textMuted,
    marginHorizontal: 5,
    fontSize: 10
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1
  },
  badgeBlue: {
    backgroundColor: COLORS.blueBg,
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  badgeRose: {
    backgroundColor: COLORS.roseBg,
    borderColor: 'rgba(244, 63, 94, 0.3)'
  },
  badgeSlate: {
    backgroundColor: COLORS.bgGlass,
    borderColor: COLORS.border
  },
  badgeEmerald: {
    backgroundColor: COLORS.emeraldBg,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  badgeAmber: {
    backgroundColor: COLORS.amberGlow,
    borderColor: COLORS.borderAmber
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  textBlue: { color: COLORS.blueLight },
  textRose: { color: COLORS.roseLight },
  textSlate: { color: COLORS.textSecondary },
  textEmerald: { color: COLORS.emeraldLight },
  textAmber: { color: COLORS.amberLight },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  callBtnText: {
    color: COLORS.emeraldLight,
    fontSize: 12,
    fontWeight: '700'
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  whatsAppBtnText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700'
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight
  },
  profileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  profileBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600'
  },
  familyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.amberGlow,
    borderRadius: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.borderAmber
  },
  familyBtnText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700'
  },
  adminActionIcons: {
    flexDirection: 'row',
    gap: 6
  },
  iconBtn: {
    backgroundColor: COLORS.bgElevated,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  deleteIconBtn: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: COLORS.roseBg
  }
});

export default MemberCard;
