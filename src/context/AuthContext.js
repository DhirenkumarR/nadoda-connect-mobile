import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, villageApi, apiClient } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Village state
  const [villages, setVillages] = useState([]);
  const [currentVillage, setCurrentVillage] = useState(null);

  // Initialize session & villages from storage / API
  useEffect(() => {
    const initAuth = async () => {
      try {
        await apiClient.init();
        const storedToken = await AsyncStorage.getItem('nadoda_token');
        const storedUser = await AsyncStorage.getItem('nadoda_user');
        const storedVillageId = await AsyncStorage.getItem('selected_village_id');

        let currentUser = null;
        if (storedToken && storedUser) {
          setToken(storedToken);
          currentUser = JSON.parse(storedUser);
          setUser(currentUser);

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

        // Fetch villages list
        try {
          const vRes = await villageApi.getAll();
          const vList = Array.isArray(vRes?.data) ? vRes.data : (Array.isArray(vRes) ? vRes : []);
          setVillages(vList);

          if (vList.length > 0) {
            // Priority: stored village > user's assigned village > first village (Baspa)
            const targetId = storedVillageId || currentUser?.assignedVillageId?._id || currentUser?.assignedVillageId || currentUser?.villageId?._id || currentUser?.villageId;
            const matched = vList.find(v => String(v._id) === String(targetId)) || vList[0];
            setCurrentVillage(matched);
          }
        } catch (vErr) {
          console.warn('Failed to fetch villages in AuthContext:', vErr.message);
        }
      } catch (err) {
        console.warn('Auth init failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const selectVillage = (v) => {
    setCurrentVillage(v);
    if (v?._id) {
      AsyncStorage.setItem('selected_village_id', v._id);
    }
  };

  const login = async (mobileNumber, password) => {
    const res = await authApi.login(mobileNumber, password);
    if (res.success && res.token && res.data) {
      await AsyncStorage.setItem('nadoda_token', res.token);
      await AsyncStorage.setItem('nadoda_user', JSON.stringify(res.data));
      await AsyncStorage.removeItem('my_family_id');
      setToken(res.token);
      setUser(res.data);

      // Match village if not selected
      if (villages.length > 0 && !currentVillage) {
        const targetId = res.data?.assignedVillageId?._id || res.data?.assignedVillageId || res.data?.villageId;
        const matched = villages.find(v => String(v._id) === String(targetId)) || villages[0];
        selectVillage(matched);
      }

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
    await AsyncStorage.removeItem('my_family_id');
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
        villages,
        currentVillage,
        selectVillage,
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

export default AuthContext;
