import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { familyApi } from '../api';

export const FamilyFormModal = ({
  visible,
  onClose,
  onSuccess,
  familyToEdit,
  village,
  initialAtak
}) => {
  const isEdit = Boolean(familyToEdit);

  const [houseNumber, setHouseNumber] = useState('');
  const [atakGu, setAtakGu] = useState('');
  const [atakEn, setAtakEn] = useState('');
  const [kuldeviGu, setKuldeviGu] = useState('');
  const [currentCityGu, setCurrentCityGu] = useState('');
  const [nativeVillageGu, setNativeVillageGu] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (familyToEdit) {
      setHouseNumber(familyToEdit.houseNumber ? String(familyToEdit.houseNumber) : '');
      setAtakGu(familyToEdit.atak?.gu || '');
      setAtakEn(familyToEdit.atak?.en || '');
      setKuldeviGu(familyToEdit.kuldevi?.gu || '');
      setCurrentCityGu(familyToEdit.address?.currentCity?.gu || '');
      setNativeVillageGu(familyToEdit.address?.nativeVillage?.gu || '');
      setStreetAddress(familyToEdit.address?.streetAddress || '');
      setPrimaryMobile(familyToEdit.primaryMobile || '');
    } else {
      setHouseNumber('');
      setAtakGu(initialAtak || '');
      setAtakEn('');
      setKuldeviGu('');
      setCurrentCityGu(village?.name?.gu || 'બાસ્પા');
      setNativeVillageGu(village?.name?.gu || 'બાસ્પા');
      setStreetAddress('');
      setPrimaryMobile('');
    }
  }, [familyToEdit, initialAtak, village, visible]);

  const handleSubmit = async () => {
    if (!houseNumber.trim()) {
      Alert.alert('જરૂરી વિગત', 'કૃપા કરીને ઘર નંબર દાખલ કરો');
      return;
    }
    if (!atakGu.trim()) {
      Alert.alert('જરૂરી વિગત', 'કૃપા કરીને અટક દાખલ કરો');
      return;
    }

    const payload = {
      villageId: village?._id || familyToEdit?.villageId,
      houseNumber: Number(houseNumber),
      atak: { gu: atakGu.trim(), en: atakEn.trim() || atakGu.trim() },
      kuldevi: { gu: kuldeviGu.trim(), en: kuldeviGu.trim() },
      address: {
        currentCity: { gu: currentCityGu.trim(), en: currentCityGu.trim() },
        nativeVillage: { gu: nativeVillageGu.trim(), en: nativeVillageGu.trim() },
        streetAddress: streetAddress.trim()
      },
      primaryMobile: primaryMobile.trim()
    };

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await familyApi.update(familyToEdit._id, payload);
      } else {
        res = await familyApi.create(payload);
      }
      if (onSuccess) onSuccess(res?.data);
      onClose();
    } catch (err) {
      Alert.alert('ભૂલ આવી', err.response?.message || err.message || 'કુટુંબ સેવ કરવામાં ભૂલ આવી');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEdit ? 'કુટુંબ માહિતી સુધારો (Edit Family)' : 'નવું કુટુંબ ઉમેરો (Add Family)'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>ઘર નંબર (House No.)*</Text>
            <TextInput
              style={styles.input}
              placeholder="દા.ત. 15"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>અટક (ગુજરાતી)*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="દા.ત. ચાવડા"
                  placeholderTextColor={COLORS.textMuted}
                  value={atakGu}
                  onChangeText={setAtakGu}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Surname (English)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chavda"
                  placeholderTextColor={COLORS.textMuted}
                  value={atakEn}
                  onChangeText={setAtakEn}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>કુળદેવી (Kuldevi)</Text>
            <TextInput
              style={styles.input}
              placeholder="દા.ત. શ્રી આશાપુરા માતાજી"
              placeholderTextColor={COLORS.textMuted}
              value={kuldeviGu}
              onChangeText={setKuldeviGu}
            />

            <Text style={styles.inputLabel}>કુટુંબનો મુખ્ય મોબાઈલ નંબર</Text>
            <TextInput
              style={styles.input}
              placeholder="10 અંકનો મોબાઈલ"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={primaryMobile}
              onChangeText={setPrimaryMobile}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>હાલનું શહેર (City)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="બાસ્પા / અમદાવાદ"
                  placeholderTextColor={COLORS.textMuted}
                  value={currentCityGu}
                  onChangeText={setCurrentCityGu}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>મૂળ ગામ (Native)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="બાસ્પા"
                  placeholderTextColor={COLORS.textMuted}
                  value={nativeVillageGu}
                  onChangeText={setNativeVillageGu}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>શેરી / રહેઠાણ સરનામું (Street Address)</Text>
            <TextInput
              style={styles.input}
              placeholder="શેરી અથવા ઘરનું સરનામું"
              placeholderTextColor={COLORS.textMuted}
              value={streetAddress}
              onChangeText={setStreetAddress}
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>રદ કરો</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.saveBtnText}>
                {loading ? 'સેવ થઈ રહ્યું છે...' : isEdit ? 'સુધારો સાચવો' : 'કુટુંબ ઉમેરો'}
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
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  scrollArea: {
    padding: 16
  },
  inputLabel: {
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
  twoCol: {
    flexDirection: 'row',
    gap: 12
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'android' ? 28 : 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgDark
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
  cancelBtnText: {
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
  saveBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700'
  }
});

export default FamilyFormModal;
