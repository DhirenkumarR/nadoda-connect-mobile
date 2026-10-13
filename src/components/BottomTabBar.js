import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const BottomTabBar = ({ activeTab, onSelectTab }) => {
  const { isSuperAdmin, isVillageAdmin } = useAuth();
  const showAdmin = isSuperAdmin || isVillageAdmin;

  const tabs = [
    {
      id: 'hierarchy',
      label: 'વંશાવળી',
      icon: (active) => (
        <Ionicons
          name={active ? 'git-network' : 'git-network-outline'}
          size={21}
          color={active ? COLORS.amber : COLORS.textMuted}
        />
      )
    },
    {
      id: 'members',
      label: 'સભ્યો',
      icon: (active) => (
        <Ionicons
          name={active ? 'people' : 'people-outline'}
          size={22}
          color={active ? COLORS.amber : COLORS.textMuted}
        />
      )
    },
    {
      id: 'my-family',
      label: 'મારું કુટુંબ',
      icon: (active) => (
        <Ionicons
          name={active ? 'home' : 'home-outline'}
          size={21}
          color={active ? COLORS.amber : COLORS.textMuted}
        />
      )
    },
    {
      id: 'stats',
      label: 'આંકડા',
      icon: (active) => (
        <Ionicons
          name={active ? 'bar-chart' : 'bar-chart-outline'}
          size={21}
          color={active ? COLORS.amber : COLORS.textMuted}
        />
      )
    }
  ];

  if (showAdmin) {
    tabs.push({
      id: 'admin',
      label: 'વહીવટ',
      icon: (active) => (
        <Ionicons
          name={active ? 'shield-checkmark' : 'shield-outline'}
          size={21}
          color={active ? COLORS.amber : COLORS.textMuted}
        />
      )
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              {tab.icon(isActive)}
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingBottom: Platform.OS === 'ios' ? 24 : 28
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingBottom: 4,
    height: 56
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3
  },
  activeTabLabel: {
    color: COLORS.amber,
    fontWeight: '700'
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.amber,
    marginTop: 2
  }
});

export default BottomTabBar;
