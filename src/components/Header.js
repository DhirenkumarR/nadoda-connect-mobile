import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const Header = ({
  selectedVillage,
  villages = [],
  onSelectVillage,
  onChangePassword,
  activeTab
}) => {
  const { user, logout, isSuperAdmin, isVillageAdmin } = useAuth();
  const [villageModalOpen, setVillageModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const roleLabel = isSuperAdmin
    ? '👑 Super Admin'
    : isVillageAdmin
    ? '🏛️ Village Admin'
    : '👤 Member';

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        {/* Left: Brand Identity */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/nododa_rajput.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.brandTitle}>નાડોદા રાજપૂત</Text>
            <Text style={styles.brandSubtitle}>Nadoda Rajput Connect</Text>
          </View>
        </View>

        {/* Right: Village Selector & Profile Trigger */}
        <View style={styles.actionsContainer}>
          {/* Village Pill */}
          <TouchableOpacity
            style={styles.villagePill}
            onPress={() => setVillageModalOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={13} color={COLORS.amber} />
            <Text style={styles.villageText} numberOfLines={1}>
              {selectedVillage?.name?.gu || 'બાસ્પા'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setProfileModalOpen(true)}
            activeOpacity={0.8}
          >
            {isSuperAdmin ? (
              <FontAwesome5 name="crown" size={13} color={COLORS.amber} />
            ) : isVillageAdmin ? (
              <Ionicons name="shield-checkmark" size={15} color={COLORS.blueLight} />
            ) : (
              <Ionicons name="person" size={15} color={COLORS.emeraldLight} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Village Selection Modal */}
      <Modal
        visible={villageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVillageModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVillageModalOpen(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ગામ પસંદ કરો (Select Village)</Text>
              <TouchableOpacity onPress={() => setVillageModalOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {villages.map((v) => {
                const isSelected = selectedVillage?._id === v._id;
                return (
                  <TouchableOpacity
                    key={v._id}
                    style={[
                      styles.villageItem,
                      isSelected && styles.villageItemSelected
                    ]}
                    onPress={() => {
                      onSelectVillage(v);
                      setVillageModalOpen(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.villageItemName, isSelected && { color: COLORS.amber }]}>
                        {v.name?.gu} ({v.name?.en})
                      </Text>
                      <Text style={styles.villageItemMeta}>
                        તા. {v.taluka?.gu || 'સમી'}, જિ. {v.district?.gu || 'પાટણ'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.amber} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile & Options Menu Modal */}
      <Modal
        visible={profileModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalOpen(false)}
        >
          <View style={styles.profileSheet}>
            <View style={styles.profileHeader}>
              <View style={styles.profileBigAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.name ? user.name.charAt(0) : 'U'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.name || user?.mobileNumber || 'User'}
                </Text>
                <Text style={styles.profileRole}>{roleLabel}</Text>
                <Text style={styles.profilePhone}>📞 {user?.mobileNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setProfileModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setProfileModalOpen(false);
                  onChangePassword();
                }}
              >
                <Ionicons name="key-outline" size={18} color={COLORS.amber} />
                <Text style={styles.actionBtnText}>પાસવર્ડ બદલો (Change Password)</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.logoutBtn]}
                onPress={() => {
                  setProfileModalOpen(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={COLORS.roseLight} />
                <Text style={[styles.actionBtnText, { color: COLORS.roseLight }]}>
                  લૉગઆઉટ કરો (Logout)
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.roseLight} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.bgDark,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  logoImage: {
    width: 32,
    height: 32
  },
  logoText: {
    color: COLORS.amber,
    fontSize: 15,
    fontWeight: '800'
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  brandSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500'
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  villagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  villageText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 80
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.borderAmber,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  villageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6
  },
  villageItemSelected: {
    backgroundColor: COLORS.amberGlow
  },
  villageItemName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  villageItemMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  profileSheet: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  profileBigAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.amberGlow,
    borderWidth: 1.5,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileAvatarText: {
    color: COLORS.amber,
    fontSize: 20,
    fontWeight: '800'
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  profileRole: {
    color: COLORS.amberLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  profilePhone: {
    color: COLORS.emeraldLight,
    fontSize: 12,
    marginTop: 2
  },
  profileActions: {
    gap: 10
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  actionBtnText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12
  },
  logoutBtn: {
    backgroundColor: COLORS.roseBg,
    borderColor: 'rgba(244, 63, 94, 0.3)'
  }
});

export default Header;
