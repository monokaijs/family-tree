import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, AppButton, AppInput } from '@/components/ui';
import Select from '@/components/ui/Select';
import { useColors } from '@/hooks/useColors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  Person,
  Gender,
  RelationshipType,
  Relationship,
  addPerson,
  updatePerson,
  removePerson,
  addRelationship,
  addPersonWithRelationship,
} from '@/store/slices/familyTreeSlice';
import { User, Trash2, Link, ImagePlus, X, Calendar, Heart, Users, Baby, ArrowUp } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { calculateNewPersonPosition } from '@/utils/familyTreeLayout';

type FormMode = 'create' | 'edit' | 'relationship';

export default function PersonFormScreen() {
  const colors = useColors();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{
    mode?: string;
    personId?: string;
    fromPersonId?: string;
    positionX?: string;
    positionY?: string;
    relatedPersonId?: string;
    relationshipType?: string;
    alsoAddToSpouseId?: string;
    alsoAddToSiblingIds?: string;
  }>();

  const { persons, relationships } = useAppSelector((state) => state.familyTree);

  const mode = (params.mode as FormMode) || 'create';
  const editingPerson = mode === 'edit' ? persons.find(p => p.id === params.personId) : null;
  const fromPerson = mode === 'relationship' ? persons.find(p => p.id === params.fromPersonId) : null;
  const relatedPerson = params.relatedPersonId ? persons.find(p => p.id === params.relatedPersonId) : null;
  const preselectedRelationType = params.relationshipType as RelationshipType | undefined;
  const alsoAddToSpouseIds = params.alsoAddToSpouseId ? params.alsoAddToSpouseId.split(',') : [];
  const alsoAddToSiblingIds = params.alsoAddToSiblingIds ? params.alsoAddToSiblingIds.split(',') : [];
  const newPosition = {
    x: params.positionX ? parseFloat(params.positionX) : 0,
    y: params.positionY ? parseFloat(params.positionY) : 0,
  };

  const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; color: string }[] = [
    { value: 'spouse', label: t('RELATIONSHIP.SPOUSE'), color: '#EC4899' },
    { value: 'parent', label: t('RELATIONSHIP.PARENT'), color: '#3B82F6' },
    { value: 'child', label: t('RELATIONSHIP.CHILD'), color: '#10B981' },
    { value: 'sibling', label: t('RELATIONSHIP.SIBLING'), color: '#F59E0B' },
  ];

  const [givenName, setGivenName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [isAlive, setIsAlive] = useState(true);
  const [avatarUri, setAvatarUri] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [workplace, setWorkplace] = useState('');

  const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('spouse');
  const [selectedExistingPersonId, setSelectedExistingPersonId] = useState<string | null>(null);

  useEffect(() => {
    if (editingPerson) {
      setGivenName(editingPerson.givenName);
      setGender(editingPerson.gender);
      setIsAlive(!editingPerson.dateOfDeath);
      setAvatarUri(editingPerson.avatarUrl || '');
      setBirthday(editingPerson.birthday ? new Date(editingPerson.birthday) : undefined);
      setPhoneNumber(editingPerson.phoneNumber || '');
      setAddress(editingPerson.address || '');
      setWorkplace(editingPerson.workplace || '');
    }
  }, [editingPerson]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('PERSON.PERMISSION_REQUIRED'), t('PERSON.PERMISSION_PHOTO'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = useCallback(() => {
    if (!givenName.trim() && !selectedExistingPersonId) return;

    if (mode === 'create') {
      const personData = {
        givenName: givenName.trim(),
        gender,
        birthday: birthday?.toISOString(),
        dateOfDeath: isAlive ? undefined : 'unknown',
        avatarUrl: avatarUri.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        address: address.trim() || undefined,
        workplace: workplace.trim() || undefined,
        photos: [],
        position: relatedPerson && preselectedRelationType
          ? calculateNewPersonPosition(relatedPerson, preselectedRelationType, persons, relationships)
          : newPosition,
      };

      if (relatedPerson && preselectedRelationType) {
        const result = dispatch(
          addPersonWithRelationship({
            person: personData,
            relatedToPersonId: relatedPerson.id,
            relationshipType: preselectedRelationType,
          })
        );

        if (alsoAddToSpouseIds.length > 0 && preselectedRelationType === 'child') {
          const newPersonId = (result.payload as any)?.id;
          if (newPersonId) {
            alsoAddToSpouseIds.forEach(spouseId => {
              dispatch(addRelationship({
                fromPersonId: spouseId,
                toPersonId: newPersonId,
                type: 'child',
              }));
            });
          }
        }

        if (alsoAddToSiblingIds.length > 0 && preselectedRelationType === 'parent') {
          const newPersonId = (result.payload as any)?.id;
          if (newPersonId) {
            alsoAddToSiblingIds.forEach(siblingId => {
              dispatch(addRelationship({
                fromPersonId: siblingId,
                toPersonId: newPersonId,
                type: 'parent',
              }));
            });
          }
        }
      } else {
        dispatch(addPerson(personData));
      }
    } else if (mode === 'edit' && editingPerson) {
      dispatch(
        updatePerson({
          ...editingPerson,
          givenName: givenName.trim(),
          gender,
          birthday: birthday?.toISOString(),
          dateOfDeath: isAlive ? undefined : editingPerson.dateOfDeath || 'unknown',
          avatarUrl: avatarUri.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          address: address.trim() || undefined,
          workplace: workplace.trim() || undefined,
        })
      );
    } else if (mode === 'relationship' && fromPerson) {
      if (selectedExistingPersonId) {
        dispatch(
          addRelationship({
            fromPersonId: fromPerson.id,
            toPersonId: selectedExistingPersonId,
            type: selectedRelationType,
          })
        );
      } else if (givenName.trim()) {
        const existingChildren = persons.filter(p =>
          relationships.some((r: Relationship) =>
            (r.type === 'child' && r.fromPersonId === fromPerson.id && r.toPersonId === p.id) ||
            (r.type === 'parent' && r.fromPersonId === p.id && r.toPersonId === fromPerson.id)
          )
        );
        const existingSpouses = persons.filter(p =>
          relationships.some((r: Relationship) =>
            r.type === 'spouse' &&
            ((r.fromPersonId === fromPerson.id && r.toPersonId === p.id) ||
              (r.fromPersonId === p.id && r.toPersonId === fromPerson.id))
          )
        );
        const existingSiblings = persons.filter(p =>
          relationships.some((r: Relationship) =>
            r.type === 'sibling' &&
            ((r.fromPersonId === fromPerson.id && r.toPersonId === p.id) ||
              (r.fromPersonId === p.id && r.toPersonId === fromPerson.id))
          )
        );
        const existingParents = persons.filter(p =>
          relationships.some((r: Relationship) =>
            (r.type === 'parent' && r.fromPersonId === fromPerson.id && r.toPersonId === p.id) ||
            (r.type === 'child' && r.fromPersonId === p.id && r.toPersonId === fromPerson.id)
          )
        );

        let offsetX = 0;
        let offsetY = 0;

        switch (selectedRelationType) {
          case 'spouse':
            offsetX = 120 + existingSpouses.length * 120;
            break;
          case 'child':
            offsetX = existingChildren.length * 100 - (existingChildren.length > 0 ? 50 : 0);
            offsetY = 150;
            break;
          case 'sibling':
            offsetX = 100 + existingSiblings.length * 100;
            break;
          case 'parent':
            offsetX = existingParents.length * 100 - (existingParents.length > 0 ? 50 : 0);
            offsetY = -150;
            break;
        }

        dispatch(
          addPersonWithRelationship({
            person: {
              givenName: givenName.trim(),
              gender,
              birthday: birthday?.toISOString(),
              dateOfDeath: isAlive ? undefined : 'unknown',
              avatarUrl: avatarUri.trim() || undefined,
              photos: [],
              position: {
                x: fromPerson.position.x + offsetX,
                y: fromPerson.position.y + offsetY,
              },
            },
            relatedToPersonId: fromPerson.id,
            relationshipType: selectedRelationType,
          })
        );
      }
    }

    router.back();
  }, [
    mode,
    givenName,
    gender,
    isAlive,
    avatarUri,
    newPosition,
    editingPerson,
    fromPerson,
    selectedExistingPersonId,
    selectedRelationType,
    dispatch,
    router,
    persons,
    relationships,
  ]);

  const handleDelete = useCallback(() => {
    if (editingPerson) {
      Alert.alert(
        t('PERSON.DELETE_PERSON'),
        t('PERSON.DELETE_CONFIRM', { name: editingPerson.givenName }),
        [
          { text: t('COMMON.CANCEL'), style: 'cancel' },
          {
            text: t('COMMON.DELETE'),
            style: 'destructive',
            onPress: () => {
              dispatch(removePerson(editingPerson.id));
              router.back();
            },
          },
        ]
      );
    }
  }, [editingPerson, dispatch, router, t]);

  const otherPersons = useMemo(() => {
    if (!fromPerson) return [];
    return persons.filter((p) => p.id !== fromPerson.id);
  }, [persons, fromPerson]);

  const getRelationshipLabel = (type: RelationshipType): string => {
    switch (type) {
      case 'spouse': return t('RELATIONSHIP.SPOUSE');
      case 'parent': return t('RELATIONSHIP.PARENT');
      case 'child': return t('RELATIONSHIP.CHILD');
      case 'sibling': return t('RELATIONSHIP.SIBLING');
      default: return type;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        if (relatedPerson && preselectedRelationType) {
          return t('PERSON.ADD_TYPE', { type: getRelationshipLabel(preselectedRelationType) });
        }
        return t('PERSON.ADD_NEW');
      case 'edit':
        return t('PERSON.EDIT');
      case 'relationship':
        return t('PERSON.ADD_RELATION');
    }
  };

  const getRelationDescription = () => {
    if (!relatedPerson || !preselectedRelationType) return '';
    switch (preselectedRelationType) {
      case 'child': return t('PERSON.CHILD_OF', { name: relatedPerson.givenName });
      case 'parent': return t('PERSON.PARENT_OF', { name: relatedPerson.givenName });
      case 'spouse': return t('PERSON.SPOUSE_OF', { name: relatedPerson.givenName });
      case 'sibling': return t('PERSON.SIBLING_OF', { name: relatedPerson.givenName });
      default: return '';
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b px-4 pb-4 pt-[60px]" style={{ borderBottomColor: colors.neutrals800 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {getTitle()}
        </AppText>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {mode === 'relationship' && otherPersons.length > 0 && (
          <View className="mb-5">
            <Select
              label={t('PERSON.TARGET_PERSON')}
              placeholder={t('PERSON.CREATE_NEW')}
              value={selectedExistingPersonId || ''}
              onValueChange={(val: string | number) => setSelectedExistingPersonId(val ? String(val) : null)}
              options={[
                { label: t('PERSON.CREATE_NEW'), value: '' },
                ...otherPersons.map(p => ({
                  label: p.givenName,
                  value: p.id,
                }))
              ]}
              searchable
            />
          </View>
        )}

        {(!selectedExistingPersonId || mode !== 'relationship') && (
          <>
            <View className="mb-5 items-center">
              <TouchableOpacity
                className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutrals600 bg-neutrals800"
                onPress={pickImage}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="h-full w-full" />
                ) : (
                  <View className="items-center justify-center gap-1">
                    <ImagePlus size={28} color={colors.neutrals400} />
                    <AppText className="text-xs font-medium text-neutrals400">
                      {t('COMMON.PHOTO')}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>

              {mode === 'relationship' && (
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  {RELATIONSHIP_OPTIONS.map((opt) => {
                    const isSelected = selectedRelationType === opt.value;
                    const IconComponent = opt.value === 'spouse' ? Heart
                      : opt.value === 'parent' ? ArrowUp
                        : opt.value === 'child' ? Baby
                          : Users;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
                        style={{
                          backgroundColor: isSelected ? opt.color + '30' : colors.neutrals800,
                          borderWidth: 1.5,
                          borderColor: isSelected ? opt.color : colors.neutrals700,
                        }}
                        onPress={() => setSelectedRelationType(opt.value)}
                      >
                        <IconComponent size={14} color={isSelected ? opt.color : colors.neutrals400} />
                        <AppText
                          className="text-xs font-semibold"
                          style={{ color: isSelected ? opt.color : colors.neutrals400 }}
                        >
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {mode === 'edit' && (
                <TouchableOpacity onPress={handleDelete} className="mt-3 flex-row items-center gap-1">
                  <Trash2 size={14} color={colors.error} />
                  <AppText className="text-xs text-error">{t('PERSON.DELETE_PERSON')}</AppText>
                </TouchableOpacity>
              )}
            </View>

            {relatedPerson && preselectedRelationType && mode === 'create' && (
              <View
                className="mb-5 flex-row items-center gap-3 rounded-xl border p-3"
                style={{ backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  {preselectedRelationType === 'child' && <Baby size={20} color={colors.primary} />}
                  {preselectedRelationType === 'parent' && <ArrowUp size={20} color={colors.primary} />}
                  {preselectedRelationType === 'spouse' && <Heart size={20} color={colors.primary} />}
                  {preselectedRelationType === 'sibling' && <Users size={20} color={colors.primary} />}
                </View>
                <View className="flex-1">
                  <AppText className="text-xs" style={{ color: colors.primary }}>
                    {t('PERSON.CREATING_NEW', { type: getRelationshipLabel(preselectedRelationType).toLowerCase() })}
                  </AppText>
                  <AppText className="font-semibold" style={{ color: colors.foreground }}>
                    {getRelationDescription()}
                  </AppText>
                </View>
              </View>
            )}

            <AppInput
              label={t('PERSON.GIVEN_NAME')}
              value={givenName}
              onChangeText={setGivenName}
              placeholder={t('PERSON.ENTER_GIVEN_NAME')}
            />

            <View className="mt-3">
              <Select
                label={t('PERSON.GENDER')}
                value={gender}
                onValueChange={(val: string | number) => setGender(val as Gender)}
                options={[
                  { label: t('PERSON.MALE'), value: 'male' },
                  { label: t('PERSON.FEMALE'), value: 'female' },
                ]}
              />
            </View>

            <View className="mt-3">
              <Select
                label={t('PERSON.STATUS')}
                value={isAlive ? 'alive' : 'passed'}
                onValueChange={(val: string | number) => setIsAlive(val === 'alive')}
                options={[
                  { label: t('PERSON.ALIVE'), value: 'alive' },
                  { label: t('PERSON.PASSED_AWAY'), value: 'passed' },
                ]}
              />
            </View>

            <View className="mt-3">
              <AppText className="mb-1.5 font-medium" style={{ color: colors.foreground }}>
                {t('PERSON.BIRTHDAY')}
              </AppText>
              <TouchableOpacity
                className="flex-row items-center justify-between rounded-lg border px-4 py-3"
                style={{ backgroundColor: colors.background, borderColor: colors.neutrals800 }}
                onPress={() => setShowDatePicker(true)}
              >
                <AppText style={{ color: birthday ? colors.foreground : colors.neutrals400 }}>
                  {birthday ? formatDate(birthday) : t('PERSON.SELECT_BIRTHDAY')}
                </AppText>
                <Calendar size={20} color={colors.neutrals400} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthday || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View className="mt-3">
              <AppInput
                label={t('PERSON.PHONE_NUMBER')}
                placeholder={t('PERSON.ENTER_PHONE')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View className="mt-3">
              <AppInput
                label={t('PERSON.ADDRESS')}
                placeholder={t('PERSON.ENTER_ADDRESS')}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View className="mt-3">
              <AppInput
                label={t('PERSON.WORKPLACE')}
                placeholder={t('PERSON.ENTER_WORKPLACE')}
                value={workplace}
                onChangeText={setWorkplace}
              />
            </View>
          </>
        )}
      </ScrollView>

      <View
        className="flex-row gap-3 border-t px-5 pb-8 pt-4"
        style={{ backgroundColor: colors.background, borderTopColor: colors.neutrals800 }}
      >
        <AppButton
          variant="ghost"
          onPress={() => router.back()}
          className="flex-1"
        >
          {t('COMMON.CANCEL')}
        </AppButton>
        <AppButton
          variant="primary"
          onPress={handleSave}
          disabled={!givenName.trim() && !selectedExistingPersonId}
          className="flex-[2]"
        >
          {mode === 'relationship' && selectedExistingPersonId ? t('COMMON.LINK') : t('COMMON.SAVE')}
        </AppButton>
      </View>
    </View>
  );
}
