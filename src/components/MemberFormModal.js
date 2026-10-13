import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { memberApi, familyApi } from '../api';

export const RELATION_OPTIONS = [
  'પોતે', 'પત્ની', 'પતિ', 'પુત્ર', 'પુત્રી', 'પુત્રવધુ',
  'પૌત્ર', 'પૌત્રી', 'દાદા', 'દાદી', 'પિતા', 'માતા',
  'ભાઈ', 'બહેન', 'કાકા', 'કાકી', 'અન્ય'
];

export const MemberFormModal = ({
  visible,
  onClose,
  onSuccess,
  memberToEdit,
  family,
  village
}) => {
  const isEdit = Boolean(memberToEdit);
  const [familiesList, setFamiliesList] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');

  const [fullNameGu, setFullNameGu] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [relationGu, setRelationGu] = useState('પોતે');
  const [genderKey, setGenderKey] = useState('male');
  const [age, setAge] = useState('');
  const [qualification, setQualification] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [maritalStatusKey, setMaritalStatusKey] = useState('married');
  const [occupationTitle, setOccupationTitle] = useState('ખેતી');
  const [workCity, setWorkCity] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isFamilyHead, setIsFamilyHead] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setFullNameGu(memberToEdit.fullName?.gu || '');
      setFullNameEn(memberToEdit.fullName?.en || '');
      setRelationGu(memberToEdit.relationWithHead?.gu || 'પોતે');
      setGenderKey(memberToEdit.gender?.key || 'male');
      setAge(memberToEdit.age ? String(memberToEdit.age) : '');
      setQualification(memberToEdit.education?.qualification || '');
      setIsStudying(Boolean(memberToEdit.education?.isStudying));
      setMaritalStatusKey(memberToEdit.maritalStatus?.key || 'married');
      setOccupationTitle(memberToEdit.occupation?.title || 'ખેતી');
      setWorkCity(memberToEdit.occupation?.workCity || '');
      setMobileNumber(memberToEdit.mobileNumber || '');
      setEmail(memberToEdit.email || '');
      setIsFamilyHead(Boolean(memberToEdit.isFamilyHead));
      setSerialNumber(memberToEdit.serialNumber ? String(memberToEdit.serialNumber) : '');

      const famId = memberToEdit.familyId?._id || memberToEdit.familyId;
      if (famId) setSelectedFamilyId(String(famId));
    } else {
      setFullNameGu('');
      setFullNameEn('');
      setRelationGu('પોતે');
      setGenderKey('male');
      setAge('');
      setQualification('');
      setIsStudying(false);
      setMaritalStatusKey('married');
      setOccupationTitle('ખેતી');
      setWorkCity(village?.name?.gu || 'બાસ્પા');
      setMobileNumber('');
      setEmail('');
      setIsFamilyHead(false);
      setSerialNumber('');

      const targetFam = family?._id || family;
      if (targetFam) setSelectedFamilyId(String(targetFam));
    }
  }, [memberToEdit, family, visible]);

  // Load families list if needed
  useEffect(() => {
    if (visible && !family && village?._id) {
      familyApi.getAll({ villageId: village._id, limit: 150 })
        .then(res => {
          if (res?.success) {
            setFamiliesList(res.data);
            if (!selectedFamilyId && res.data.length > 0) {
              setSelectedFamilyId(res.data[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [visible, village?._id]);

  const handleRelationSelect = (rel) => {
    setRelationGu(rel);
    const femaleRelations = ['પત્ની', 'પુત્રી', 'પુત્રવધુ', 'પૌત્રી', 'માતા', 'દાદી', 'બહેન', 'કાકી'];
    const maleRelations = ['પોતે', 'પતિ', 'પુત્ર', 'પૌત્ર', 'પિતા', 'દાદા', 'ભાઈ', 'કાકા'];
    if (femaleRelations.includes(rel)) setGenderKey('female');
    else if (maleRelations.includes(rel)) setGenderKey('male');
  };

  const handleSubmit = async () => {
    if (!fullNameGu.trim()) {
      Alert.alert('જરૂરી વિગત', 'કૃપા કરીને સભ્યનું પૂરું નામ દાખલ કરો');
      return;
    }

    const targetFamId = selectedFamilyId || family?._id || (typeof family === 'string' ? family : '');
    if (!targetFamId) {
      Alert.alert('જરૂરી વિગત', 'કૃપા કરીને કુટુંબ પસંદ કરો');
      return;
    }

    const maritalMap = {
      married: 'પરણિત',
      unmarried: 'અપરણિત',
      widow: 'વિધવા',
      widower: 'વિધુર',
      divorced: 'છૂટાછેડા'
    };

    const resolvedVillageId = village?._id || memberToEdit?.villageId?._id || memberToEdit?.villageId || family?.villageId?._id || family?.villageId;

    const payload = {
      villageId: resolvedVillageId,
      familyId: targetFamId,
      serialNumber: serialNumber ? Number(serialNumber) : undefined,
      fullName: { gu: fullNameGu.trim(), en: fullNameEn.trim() },
      relationWithHead: { gu: relationGu, en: relationGu },
      gender: {
        key: genderKey,
        gu: genderKey === 'male' ? 'પુરુષ' : 'સ્ત્રી'
      },
      age: age ? Number(age) : undefined,
      education: {
        qualification: qualification.trim(),
        isStudying
      },
      maritalStatus: {
        key: maritalStatusKey,
        gu: maritalMap[maritalStatusKey] || 'પરણિત'
      },
      occupation: {
        title: occupationTitle.trim(),
        category: 'other',
        workCity: workCity.trim()
      },
      mobileNumber: mobileNumber.trim(),
      email: email.trim().toLowerCase() || undefined,
      isFamilyHead
    };

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await memberApi.update(memberToEdit._id, payload);
      } else {
        res = await memberApi.create(payload);
      }

      if (onSuccess) onSuccess(res?.data);
      onClose();
    } catch (err) {
      Alert.alert('ભૂલ આવી', err.response?.message || err.message || 'સભ્ય સેવ કરવામાં ભૂલ આવી');
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
              {isEdit ? 'સભ્ય વિગત સુધારો (Edit Member)' : 'નવો સભ્ય ઉમેરો (Add Member)'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <Text style={styles.inputLabel}>પૂરું નામ (ગુજરાતી)*</Text>
            <TextInput
              style={styles.input}
              placeholder="દા.ત. ચાવડા કાંતિભાઈ કરમણભાઈ"
              placeholderTextColor={COLORS.textMuted}
              value={fullNameGu}
              onChangeText={setFullNameGu}
            />

            <Text style={styles.inputLabel}>Full Name (English)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chavda Kantibhai Karmanbhai"
              placeholderTextColor={COLORS.textMuted}
              value={fullNameEn}
              onChangeText={setFullNameEn}
            />

            {/* Relation Pills */}
            <Text style={styles.inputLabel}>મોભી સાથે સંબંધ (Relation)*</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {RELATION_OPTIONS.map((rel) => {
                const isSelected = relationGu === rel;
                return (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => handleRelationSelect(rel)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Gender Selection */}
            <Text style={styles.inputLabel}>જાતિ (Gender)*</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, genderKey === 'male' && styles.genderBtnMale]}
                onPress={() => setGenderKey('male')}
              >
                <Ionicons name="male" size={16} color={genderKey === 'male' ? '#FFF' : COLORS.textMuted} />
                <Text style={[styles.genderBtnText, genderKey === 'male' && { color: '#FFF' }]}>
                  પુરુષ (Male)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderBtn, genderKey === 'female' && styles.genderBtnFemale]}
                onPress={() => setGenderKey('female')}
              >
                <Ionicons name="female" size={16} color={genderKey === 'female' ? '#FFF' : COLORS.textMuted} />
                <Text style={[styles.genderBtnText, genderKey === 'female' && { color: '#FFF' }]}>
                  સ્ત્રી (Female)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Age & Serial Number */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>ઉંમર (Age)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="વર્ષ"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>સળંગ ક્રમ (#)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Serial No."
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                />
              </View>
            </View>

            {/* Education */}
            <Text style={styles.inputLabel}>અભ્યાસ (Education)</Text>
            <TextInput
              style={styles.input}
              placeholder="દા.ત. 10, 12, બી.એ., બી.એસસી."
              placeholderTextColor={COLORS.textMuted}
              value={qualification}
              onChangeText={setQualification}
            />

            {/* Occupation & Work City */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>વ્યવસાય (Occupation)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ખેતી / નોકરી"
                  placeholderTextColor={COLORS.textMuted}
                  value={occupationTitle}
                  onChangeText={setOccupationTitle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>કાર્યક્ષેત્ર / શહેર (Work City)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="બાસ્પા / અમદાવાદ"
                  placeholderTextColor={COLORS.textMuted}
                  value={workCity}
                  onChangeText={setWorkCity}
                />
              </View>
            </View>

            {/* Mobile & Email */}
            <Text style={styles.inputLabel}>મોબાઈલ નંબર</Text>
            <TextInput
              style={styles.input}
              placeholder="10 અંકનો મોબાઈલ"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            <Text style={styles.inputLabel}>ઈમેલ સરનામું (Email)</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Is Family Head Switch */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>કુટુંબના મુખ્ય સભ્ય (Head of Family)</Text>
                <Text style={styles.switchSub}>પરિવારના મોભી તરીકે નિર્ધારિત કરો</Text>
              </View>
              <Switch
                value={isFamilyHead}
                onValueChange={setIsFamilyHead}
                trackColor={{ false: COLORS.bgElevated, true: COLORS.amber }}
                thumbColor={isFamilyHead ? '#FFF' : COLORS.textMuted}
              />
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>રદ કરો</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'સેવ થઈ રહ્યું છે...' : isEdit ? 'સુધારો સાચવો (Update)' : 'સભ્ય ઉમેરો (Save)'}
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
    maxHeight: '92%',
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
  pillRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  pill: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  pillActive: {
    backgroundColor: COLORS.amberGlow,
    borderColor: COLORS.amber
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  pillTextActive: {
    color: COLORS.amber,
    fontWeight: '700'
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bgElevated,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  genderBtnMale: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blueLight
  },
  genderBtnFemale: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.roseLight
  },
  genderBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgElevated,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 14
  },
  switchTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  switchSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2
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

export default MemberFormModal;
