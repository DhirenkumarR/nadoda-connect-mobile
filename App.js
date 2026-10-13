import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/theme/colors';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HierarchyScreen from './src/screens/HierarchyScreen';
import MembersScreen from './src/screens/MembersScreen';
import MyFamilyScreen from './src/screens/MyFamilyScreen';
import StatsScreen from './src/screens/StatsScreen';
import AdminScreen from './src/screens/AdminScreen';

// Components & Modals
import Header from './src/components/Header';
import BottomTabBar from './src/components/BottomTabBar';
import MemberDetailModal from './src/components/MemberDetailModal';
import MemberFormModal from './src/components/MemberFormModal';
import FamilyFormModal from './src/components/FamilyFormModal';
import ChangePasswordModal from './src/components/ChangePasswordModal';

function MainApp() {
  const {
    user,
    loading,
    isAuthenticated,
    villages,
    currentVillage,
    selectVillage,
    isSuperAdmin,
    isVillageAdmin,
    canManageVillage
  } = useAuth();

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState('hierarchy');

  // Jump to Family State
  const [targetFamilyId, setTargetFamilyId] = useState(null);

  // Modals state
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [memberFormVisible, setMemberFormVisible] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [memberFormFamily, setMemberFormFamily] = useState(null);

  const [familyFormVisible, setFamilyFormVisible] = useState(false);
  const [familyToEdit, setFamilyToEdit] = useState(null);
  const [familyInitialAtak, setFamilyInitialAtak] = useState(null);

  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  // Refresh trigger on edit/add success
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handlers
  const handleOpenMemberDetail = (member) => {
    setSelectedMemberForDetail(member);
    setDetailModalVisible(true);
  };

  const handleOpenAddMember = (targetFam = null) => {
    setMemberToEdit(null);
    setMemberFormFamily(targetFam);
    setMemberFormVisible(true);
  };

  const handleOpenEditMember = (member) => {
    setMemberToEdit(member);
    setMemberFormFamily(member.familyId || null);
    setMemberFormVisible(true);
  };

  const handleOpenAddFamily = (atakName = null) => {
    setFamilyToEdit(null);
    setFamilyInitialAtak(atakName);
    setFamilyFormVisible(true);
  };

  const handleOpenEditFamily = (family) => {
    setFamilyToEdit(family);
    setFamilyInitialAtak(family?.atak || null);
    setFamilyFormVisible(true);
  };

  const handleJumpToFamily = (familyId) => {
    setDetailModalVisible(false);
    setTargetFamilyId(familyId);
    setActiveTab('hierarchy');
  };

  // 1. Loading splash screen
  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <View style={styles.splashIconCircle}>
          <Ionicons name="people" size={40} color={COLORS.amber} />
        </View>
        <Text style={styles.splashTitle}>નાદોડા કનેક્ટ</Text>
        <Text style={styles.splashSubtitle}>Nadoda Rajput Community</Text>
        <ActivityIndicator size="small" color={COLORS.amber} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // 2. Unauthenticated -> Login Screen
  if (!isAuthenticated) {
    return (
      <View style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <LoginScreen />
      </View>
    );
  }

  // 3. Authenticated App
  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      {/* Top Header */}
      <Header
        selectedVillage={currentVillage}
        villages={villages}
        onSelectVillage={selectVillage}
        onChangePassword={() => setChangePasswordVisible(true)}
        activeTab={activeTab}
      />

      {/* Main Screen Body */}
      <View style={styles.screenBody} key={refreshTrigger}>
        {activeTab === 'hierarchy' && (
          <HierarchyScreen
            targetFamilyId={targetFamilyId}
            clearTargetFamily={() => setTargetFamilyId(null)}
            onOpenMemberDetail={handleOpenMemberDetail}
            onOpenAddMember={handleOpenAddMember}
            onOpenEditMember={handleOpenEditMember}
            onOpenAddFamily={handleOpenAddFamily}
            onOpenEditFamily={handleOpenEditFamily}
          />
        )}

        {activeTab === 'members' && (
          <MembersScreen
            onOpenMemberDetail={handleOpenMemberDetail}
            onOpenAddMember={handleOpenAddMember}
            onOpenEditMember={handleOpenEditMember}
            onJumpToFamily={handleJumpToFamily}
          />
        )}

        {(activeTab === 'my-family' || activeTab === 'myFamily') && (
          <MyFamilyScreen
            onOpenMemberDetail={handleOpenMemberDetail}
            onOpenAddMember={handleOpenAddMember}
            onOpenEditMember={handleOpenEditMember}
            onOpenEditFamily={handleOpenEditFamily}
          />
        )}

        {activeTab === 'stats' && <StatsScreen />}

        {activeTab === 'admin' && (isSuperAdmin || isVillageAdmin) && <AdminScreen />}
      </View>

      {/* Instagram-Style Bottom Navigation */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Full Profile Detail Modal */}
      <MemberDetailModal
        visible={detailModalVisible}
        member={selectedMemberForDetail}
        village={currentVillage}
        onClose={() => setDetailModalVisible(false)}
        onEdit={(m) => {
          setDetailModalVisible(false);
          handleOpenEditMember(m);
        }}
        onGoToFamily={(fId) => handleJumpToFamily(fId)}
      />

      {/* Member Form Modal (Add/Edit) */}
      <MemberFormModal
        visible={memberFormVisible}
        memberToEdit={memberToEdit}
        family={memberFormFamily}
        village={currentVillage}
        onClose={() => setMemberFormVisible(false)}
        onSuccess={() => {
          setMemberFormVisible(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Family Form Modal (Add/Edit) */}
      <FamilyFormModal
        visible={familyFormVisible}
        familyToEdit={familyToEdit}
        initialAtak={familyInitialAtak}
        village={currentVillage}
        onClose={() => setFamilyFormVisible(false)}
        onSuccess={() => {
          setFamilyFormVisible(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  screenBody: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  splashIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 16
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.amber,
    letterSpacing: 0.5
  },
  splashSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5
  }
});
