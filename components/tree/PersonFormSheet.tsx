import React, { useState, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { AppText, AppButton, AppInput } from '@/components/ui';
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
import { User, Trash2, Link, Heart, HeartOff, ImagePlus, Mars, Venus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface PersonFormSheetProps {
  onClose?: () => void;
  onPersonAdded?: (position: { x: number; y: number }) => void;
}

export interface PersonFormSheetRef {
  openForNew: (position: { x: number; y: number }) => void;
  openForEdit: (person: Person) => void;
  openForRelationship: (fromPerson: Person) => void;
  close: () => void;
}

type FormMode = 'create' | 'edit' | 'relationship';

const GENDER_OPTIONS: { value: Gender; label: string; color: string }[] = [
  { value: 'male', label: 'Male', color: '#3B82F6' },
  { value: 'female', label: 'Female', color: '#EC4899' },
  { value: 'other', label: 'Other', color: '#EAB308' },
];

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; color: string; icon: string }[] = [
  { value: 'spouse', label: 'Spouse', color: '#EC4899', icon: '💍' },
  { value: 'parent', label: 'Parent', color: '#3B82F6', icon: '👨‍👩‍👧' },
  { value: 'child', label: 'Child', color: '#10B981', icon: '👶' },
  { value: 'sibling', label: 'Sibling', color: '#F59E0B', icon: '👫' },
];

const PersonFormSheet = forwardRef<PersonFormSheetRef, PersonFormSheetProps>(
  ({ onClose, onPersonAdded }, ref) => {
    const colors = useColors();
    const dispatch = useAppDispatch();
    const { persons, relationships } = useAppSelector((state) => state.familyTree);
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [mode, setMode] = useState<FormMode>('create');
    const [fromPerson, setFromPerson] = useState<Person | null>(null);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [newPosition, setNewPosition] = useState({ x: 0, y: 0 });

    const [givenName, setGivenName] = useState('');
    const [gender, setGender] = useState<Gender>('male');
    const [birthday, setBirthday] = useState('');
    const [isAlive, setIsAlive] = useState(true);
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [avatarUri, setAvatarUri] = useState('');

    const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('spouse');
    const [selectedExistingPersonId, setSelectedExistingPersonId] = useState<string | null>(null);

    const resetForm = useCallback(() => {
      setGivenName('');
      setGender('male');
      setBirthday('');
      setIsAlive(true);
      setDateOfDeath('');
      setAvatarUri('');
      setSelectedRelationType('spouse');
      setSelectedExistingPersonId(null);
      setEditingPerson(null);
      setFromPerson(null);
    }, []);

    const populateForm = useCallback((person: Person) => {
      setGivenName(person.givenName);
      setGender(person.gender);
      setBirthday(person.birthday || '');
      const hasDeath = !!person.dateOfDeath;
      setIsAlive(!hasDeath);
      setDateOfDeath(person.dateOfDeath || '');
      setAvatarUri(person.avatarUrl || '');
    }, []);

    useImperativeHandle(ref, () => ({
      openForNew: (position) => {
        resetForm();
        setMode('create');
        setNewPosition(position);
        bottomSheetRef.current?.present();
      },
      openForEdit: (person) => {
        resetForm();
        setMode('edit');
        setEditingPerson(person);
        populateForm(person);
        bottomSheetRef.current?.present();
      },
      openForRelationship: (person) => {
        resetForm();
        setMode('relationship');
        setFromPerson(person);
        bottomSheetRef.current?.present();
      },
      close: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    const pickImage = async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select a photo.');
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

      let finalPosition = newPosition;
      const finalDateOfDeath = isAlive ? undefined : (dateOfDeath.trim() || undefined);

      if (mode === 'create') {
        dispatch(
          addPerson({
            givenName: givenName.trim(),
            gender,
            birthday: birthday.trim() || undefined,
            dateOfDeath: finalDateOfDeath,
            avatarUrl: avatarUri.trim() || undefined,
            photos: [],
            position: newPosition,
          })
        );
        onPersonAdded?.(newPosition);
      } else if (mode === 'edit' && editingPerson) {
        dispatch(
          updatePerson({
            ...editingPerson,
            givenName: givenName.trim(),
            gender,
            birthday: birthday.trim() || undefined,
            dateOfDeath: finalDateOfDeath,
            avatarUrl: avatarUri.trim() || undefined,
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
          let baseX = fromPerson.position.x;

          if (selectedRelationType === 'spouse') {
            offsetX = 120 * (existingSpouses.length + 1);
            offsetY = 0;
          } else if (selectedRelationType === 'sibling') {
            offsetX = 120 * (existingSiblings.length + 1);
            offsetY = 0;
          } else if (selectedRelationType === 'child') {
            const spouse = existingSpouses[0];
            if (spouse) {
              baseX = (fromPerson.position.x + spouse.position.x) / 2;
            }
            const totalChildren = existingChildren.length + 1;
            const childIndex = existingChildren.length;
            const startOffset = -((totalChildren - 1) * 60);
            offsetX = startOffset + (childIndex * 120);
            offsetY = 180;
          } else if (selectedRelationType === 'parent') {
            const parentIndex = existingParents.length;
            offsetX = parentIndex === 0 ? -60 : 60;
            offsetY = -180;
          }

          finalPosition = {
            x: baseX + offsetX,
            y: fromPerson.position.y + offsetY,
          };

          const NODE_SIZE = 100;
          const isOverlapping = (pos: { x: number; y: number }) => {
            return persons.some(p => {
              const dx = Math.abs(p.position.x - pos.x);
              const dy = Math.abs(p.position.y - pos.y);
              return dx < NODE_SIZE && dy < NODE_SIZE;
            });
          };

          let attempts = 0;
          const maxAttempts = 20;

          while (isOverlapping(finalPosition) && attempts < maxAttempts) {
            attempts++;
            const distance = Math.ceil(attempts / 2) * 120;
            const direction = attempts % 2 === 1 ? 1 : -1;
            finalPosition = {
              x: baseX + offsetX + (direction * distance),
              y: fromPerson.position.y + offsetY,
            };
          }

          dispatch(
            addPersonWithRelationship({
              person: {
                givenName: givenName.trim(),
                gender,
                birthday: birthday.trim() || undefined,
                dateOfDeath: finalDateOfDeath,
                avatarUrl: avatarUri.trim() || undefined,
                photos: [],
                position: finalPosition,
              },
              relatedToPersonId: fromPerson.id,
              relationshipType: selectedRelationType,
            })
          );

          onPersonAdded?.(finalPosition);
        }
      }

      bottomSheetRef.current?.dismiss();
      resetForm();
      onClose?.();
    }, [
      mode,
      dispatch,
      givenName,
      gender,
      birthday,
      isAlive,
      dateOfDeath,
      avatarUri,
      newPosition,
      editingPerson,
      fromPerson,
      selectedExistingPersonId,
      selectedRelationType,
      resetForm,
      onClose,
      onPersonAdded,
    ]);

    const handleDelete = useCallback(() => {
      if (editingPerson) {
        dispatch(removePerson(editingPerson.id));
        bottomSheetRef.current?.dismiss();
        resetForm();
        onClose?.();
      }
    }, [editingPerson, dispatch, resetForm, onClose]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    const otherPersons = useMemo(() => {
      if (!fromPerson) return [];
      return persons.filter((p) => p.id !== fromPerson.id);
    }, [persons, fromPerson]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.neutrals500 }}
        backgroundStyle={{ backgroundColor: colors.neutrals900 }}
        onDismiss={() => {
          resetForm();
          onClose?.();
        }}
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
          {mode === 'relationship' && (
            <View className="mb-4">
              <AppText className="mb-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.neutrals300 }}>
                Relationship Type
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    className="w-[48%] flex-row items-center justify-center gap-2 rounded-lg border-[1.5px] px-2.5 py-3"
                    style={{
                      backgroundColor: selectedRelationType === opt.value ? opt.color + '30' : colors.neutrals800,
                      borderColor: selectedRelationType === opt.value ? opt.color : colors.neutrals700,
                    }}
                    onPress={() => setSelectedRelationType(opt.value)}
                  >
                    <AppText className="text-lg">{opt.icon}</AppText>
                    <AppText
                      className="text-xs font-semibold"
                      style={{ color: selectedRelationType === opt.value ? opt.color : colors.foreground }}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {mode === 'relationship' && otherPersons.length > 0 && (
            <View className="mb-4">
              <AppText className="mb-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.neutrals300 }}>
                Link to Existing Person
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2.5">
                {otherPersons.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    className="mr-2 w-[70px] items-center rounded-lg border-[1.5px] px-1.5 py-2.5"
                    style={{
                      backgroundColor: selectedExistingPersonId === person.id ? colors.primary + '30' : colors.neutrals800,
                      borderColor: selectedExistingPersonId === person.id ? colors.primary : colors.neutrals700,
                    }}
                    onPress={() => setSelectedExistingPersonId(selectedExistingPersonId === person.id ? null : person.id)}
                  >
                    <View className="mb-1 h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.neutrals700 }}>
                      {person.avatarUrl ? (
                        <Image source={{ uri: person.avatarUrl }} className="h-7 w-7 rounded-full" />
                      ) : (
                        <User size={16} color={colors.neutrals300} />
                      )}
                    </View>
                    <AppText numberOfLines={1} className="text-center text-[10px]" style={{ color: colors.foreground }}>
                      {person.givenName}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedExistingPersonId && (
                <View className="flex-row items-center rounded-lg p-2.5" style={{ backgroundColor: colors.primary + '20' }}>
                  <Link size={14} color={colors.primary} />
                  <AppText className="ml-2 flex-1 text-xs" style={{ color: colors.primary }}>
                    Will link to existing person. Clear to create new.
                  </AppText>
                </View>
              )}
            </View>
          )}

          {(!selectedExistingPersonId || mode !== 'relationship') && (
            <>
              <View className="mb-4 items-center">
                <TouchableOpacity
                  className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed"
                  style={{ backgroundColor: colors.neutrals800, borderColor: colors.neutrals600 }}
                  onPress={pickImage}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} className="h-full w-full" />
                  ) : (
                    <View className="items-center justify-center gap-1">
                      <ImagePlus size={24} color={colors.neutrals400} />
                      <AppText className="text-[10px] font-medium" style={{ color: colors.neutrals400 }}>
                        Photo
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
                {mode === 'edit' && (
                  <TouchableOpacity onPress={handleDelete} className="mt-2 flex-row items-center gap-1">
                    <Trash2 size={14} color={colors.error} />
                    <AppText className="text-xs" style={{ color: colors.error }}>Delete</AppText>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-4 flex-row gap-3">
                <View className="flex-1">
                  <AppText className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: colors.neutrals500 }}>
                    Gender
                  </AppText>
                  <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.neutrals800 }}>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2"
                      style={{
                        backgroundColor: gender === 'male' ? '#3B82F6' : 'transparent',
                      }}
                      onPress={() => setGender('male')}
                    >
                      <Mars size={14} color={gender === 'male' ? '#fff' : colors.neutrals400} />
                      <AppText
                        className="text-[11px] font-semibold"
                        style={{ color: gender === 'male' ? '#fff' : colors.neutrals400 }}
                      >
                        Male
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2"
                      style={{
                        backgroundColor: gender === 'female' ? '#EC4899' : 'transparent',
                      }}
                      onPress={() => setGender('female')}
                    >
                      <Venus size={14} color={gender === 'female' ? '#fff' : colors.neutrals400} />
                      <AppText
                        className="text-[11px] font-semibold"
                        style={{ color: gender === 'female' ? '#fff' : colors.neutrals400 }}
                      >
                        Female
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-1">
                  <AppText className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: colors.neutrals500 }}>
                    Status
                  </AppText>
                  <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.neutrals800 }}>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2"
                      style={{
                        backgroundColor: isAlive ? '#10B981' : 'transparent',
                      }}
                      onPress={() => setIsAlive(true)}
                    >
                      <Heart size={14} color={isAlive ? '#fff' : colors.neutrals400} />
                      <AppText
                        className="text-[11px] font-semibold"
                        style={{ color: isAlive ? '#fff' : colors.neutrals400 }}
                      >
                        Alive
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2"
                      style={{
                        backgroundColor: !isAlive ? '#64748B' : 'transparent',
                      }}
                      onPress={() => setIsAlive(false)}
                    >
                      <HeartOff size={14} color={!isAlive ? '#fff' : colors.neutrals400} />
                      <AppText
                        className="text-[11px] font-semibold"
                        style={{ color: !isAlive ? '#fff' : colors.neutrals400 }}
                      >
                        Passed
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View className="mb-3">
                <AppInput
                  value={givenName}
                  onChangeText={setGivenName}
                  placeholder="Given name"
                />
              </View>
            </>
          )}

          <View className="flex-row gap-3 pt-2">
            <AppButton
              variant="ghost"
              onPress={() => bottomSheetRef.current?.dismiss()}
              className="flex-1"
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onPress={handleSave}
              disabled={!givenName.trim() && !selectedExistingPersonId}
              className="flex-[2]"
            >
              {mode === 'relationship' && selectedExistingPersonId ? 'Link' : 'Save'}
            </AppButton>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default PersonFormSheet;
