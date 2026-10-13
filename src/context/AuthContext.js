import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, apiClient } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        await apiClient.init();
        const storedToken = await AsyncStorage.getItem('nadoda_token');
        const storedUser = await AsyncStorage.getItem('nadoda_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Silently refresh profile in background
          authApi.getMe()
            .then(res => {
              if (res?.success && res?.data) {
                setUser(res.data);
                AsyncStorage.setItem('nadoda_user', JSON.stringify(res.data));
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn('Auth init failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (mobileNumber, password) => {
    const res = await authApi.login(mobileNumber, password);
    if (res.success && res.token && res.data) {
      await AsyncStorage.setItem('nadoda_token', res.token);
      await AsyncStorage.setItem('nadoda_user', JSON.stringify(res.data));
      setToken(res.token);
      setUser(res.data);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    await AsyncStorage.removeItem('nadoda_token');
    await AsyncStorage.removeItem('nadoda_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res?.success && res?.data) {
        setUser(res.data);
        await AsyncStorage.setItem('nadoda_user', JSON.stringify(res.data));
        return res.data;
      }
    } catch {}
    return null;
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isVillageAdmin = user?.role === 'village_admin';
  const isMember = user?.role === 'member';

  const canManageVillage = (villageId) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (isVillageAdmin) {
      const assigned = user.assignedVillageId?._id || user.assignedVillageId;
      return String(assigned) === String(villageId);
    }
    return false;
  };

  const canManageFamily = (familyId) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (user.familyId) {
      return String(user.familyId) === String(familyId);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        logout,
        refreshUser,
        isSuperAdmin,
        isVillageAdmin,
        isMember,
        canManageVillage,
        canManageFamily
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
