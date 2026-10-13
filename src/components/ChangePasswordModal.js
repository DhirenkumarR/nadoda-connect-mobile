import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { authApi } from '../api';

export const ChangePasswordModal = ({ visible, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('જરૂરી વિગત', 'કૃપા કરીને જૂનો અને નવો પાસવર્ડ દાખલ કરો');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('પાસવર્ડ લંબાઈ', 'નવો પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરોનો હોવો જોઈએ');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('પાસવર્ડ મેળ ખાતો નથી', 'નવો પાસવર્ડ અને પુષ્ટિ પાસવર્ડ મેળ ખાતા નથી');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(oldPassword, newPassword);
      if (res?.success) {
        Alert.alert('સફળતા', 'પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો છે!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } catch (err) {
      Alert.alert('ભૂલ આવી', err.response?.message || err.message || 'પાસવર્ડ બદલવામાં ભૂલ આવી');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="key-outline" size={20} color={COLORS.amber} />
              <Text style={styles.title}>પાસવર્ડ બદલો (Change Password)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>જૂનો પાસવર્ડ (Current Password)*</Text>
            <TextInput
              style={styles.input}
              placeholder="જૂનો પાસવર્ડ દાખલ કરો"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <Text style={styles.label}>નવો પાસવર્ડ (New Password)*</Text>
            <TextInput
              style={styles.input}
              placeholder="ઓછામાં ઓછા 6 અક્ષર"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>નવો પાસવર્ડ ફરીથી લખો (Confirm)*</Text>
            <TextInput
              style={styles.input}
              placeholder="નવો પાસવર્ડ પુષ્ટિ કરો"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>રદ કરો</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.saveText}>
                {loading ? 'બદલાઈ રહ્યો છે...' : 'પાસવર્ડ બદલો'}
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 20
  },
  dialog: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  body: {
    paddingVertical: 14
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.amber,
    alignItems: 'center'
  },
  saveText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700'
  }
});

export default ChangePasswordModal;
