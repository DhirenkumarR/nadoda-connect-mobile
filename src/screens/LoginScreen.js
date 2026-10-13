import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!mobileNumber.trim()) {
      setError('કૃપા કરીને તમારો મોબાઈલ નંબર દાખલ કરો');
      return;
    }
    if (!password) {
      setError('કૃપા કરીને તમારો પાસવર્ડ દાખલ કરો');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(mobileNumber.trim(), password);
    } catch (err) {
      setError(err.response?.message || err.message || 'લૉગઇન નિષ્ફળ. સાચો નંબર અને પાસવર્ડ દાખલ કરો.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header & Logo */}
          <View style={styles.headerContainer}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>ના</Text>
              </View>
            </View>

            <Text style={styles.appNameGu}>નાડોદા રાજપૂત કનેક્ટ</Text>
            <Text style={styles.appNameEn}>Nadoda Rajput Connect</Text>
            <Text style={styles.appDesc}>
              શ્રી નાડોદા રાજપૂત સમાજ વસ્તી ગણતરી અને વંશાવળી પ્લેટફોર્મ
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>સભ્ય પ્રવેશ (Sign In)</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.roseLight} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Mobile Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>મોબાઈલ નંબર (Mobile Number)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="10 અંકનો મોબાઈલ નંબર"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={(t) => {
                    setMobileNumber(t);
                    setError('');
                  }}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>પાસવર્ડ (Password)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="તમારો ગુપ્ત પાસવર્ડ"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.loginBtnWrapper}
            >
              <LinearGradient
                colors={COLORS.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.loginBtnText}>લૉગઇન કરો (Login)</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.helpBox}>
              <Text style={styles.helpText}>
                💡 પાસવર્ડ ભૂલી ગયા છો? કૃપા કરીને તમારા ગામના વહીવટી એડમિનનો સંપર્ક કરો.
              </Text>
            </View>
          </View>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              All rights reserved by <Text style={{ color: COLORS.amber }}>Dhirenkumar Rathod</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    color: COLORS.amber,
    fontSize: 28,
    fontWeight: '800'
  },
  appNameGu: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  appNameEn: {
    color: COLORS.amberLight,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  },
  appDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.roseBg,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14
  },
  errorText: {
    color: COLORS.roseLight,
    fontSize: 12,
    flex: 1
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  inputIcon: {
    paddingLeft: 12
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15
  },
  eyeBtn: {
    padding: 12
  },
  loginBtnWrapper: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden'
  },
  loginBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800'
  },
  helpBox: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center'
  },
  footer: {
    marginTop: 24,
    alignItems: 'center'
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11
  }
});
