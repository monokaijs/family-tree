import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, AppButton } from '@/components/ui';
import Select from '@/components/ui/Select';
import { useColors } from '@/hooks/useColors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { RelationshipType, addRelationship, Relationship, Person } from '@/store/slices/familyTreeSlice';
import { Heart, Users, Baby, ArrowUp, User, Plus, Link } from 'lucide-react-native';

export interface AddRelationSheetRef {
  open: (fromPersonId: string) => void;
  close: () => void;
}

interface AddRelationSheetProps {
  onComplete?: () => void;
}

const getInverseRelationType = (type: RelationshipType): RelationshipType => {
  switch (type) {
    case 'parent': return 'child';
    case 'child': return 'parent';
    default: return type;
  }
};

const AddRelationSheet = forwardRef<AddRelationSheetRef, AddRelationSheetProps>(
  ({ onComplete }, ref) => {
    const colors = useColors();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [fromPersonId, setFromPersonId] = useState<string | null>(null);
    const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('spouse');
    const [selectedTargetPersonId, setSelectedTargetPersonId] = useState<string | null>(null);
    const [addToSpouse, setAddToSpouse] = useState(true);
    const [addToSiblings, setAddToSiblings] = useState(true);

    const { persons, relationships } = useAppSelector((state) => state.familyTree);
    const fromPerson = persons.find(p => p.id === fromPersonId);

    const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; color: string }[] = [
      { value: 'spouse', label: t('RELATIONSHIP.SPOUSE'), color: '#EC4899' },
      { value: 'parent', label: t('RELATIONSHIP.PARENT'), color: '#3B82F6' },
      { value: 'child', label: t('RELATIONSHIP.CHILD'), color: '#10B981' },
      { value: 'sibling', label: t('RELATIONSHIP.SIBLING'), color: '#F59E0B' },
    ];

    const spouses = useMemo(() => {
      if (!fromPersonId) return [];
      const spouseIds: string[] = [];
      relationships.forEach((r: Relationship) => {
        if (r.type === 'spouse') {
          if (r.fromPersonId === fromPersonId) spouseIds.push(r.toPersonId);
          else if (r.toPersonId === fromPersonId) spouseIds.push(r.fromPersonId);
        }
      });
      return persons.filter(p => spouseIds.includes(p.id));
    }, [fromPersonId, relationships, persons]);

    const siblings = useMemo(() => {
      if (!fromPersonId) return [];
      const siblingIds: string[] = [];
      relationships.forEach((r: Relationship) => {
        if (r.type === 'sibling') {
          if (r.fromPersonId === fromPersonId) siblingIds.push(r.toPersonId);
          else if (r.toPersonId === fromPersonId) siblingIds.push(r.fromPersonId);
        }
      });
      return persons.filter(p => siblingIds.includes(p.id));
    }, [fromPersonId, relationships, persons]);

    const otherPersons = useMemo(() => {
      if (!fromPersonId) return [];
      return persons.filter(p => p.id !== fromPersonId);
    }, [persons, fromPersonId]);

    useImperativeHandle(ref, () => ({
      open: (personId: string) => {
        setFromPersonId(personId);
        setSelectedRelationType('spouse');
        setSelectedTargetPersonId(null);
        setAddToSpouse(true);
        setAddToSiblings(true);
        bottomSheetRef.current?.present();
      },
      close: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

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

    const handleCreateNew = useCallback(() => {
      if (!fromPersonId) return;
      bottomSheetRef.current?.dismiss();
      router.push({
        pathname: '/person-form',
        params: {
          mode: 'create',
          relatedPersonId: fromPersonId,
          relationshipType: selectedRelationType,
          alsoAddToSpouseId: (selectedRelationType === 'child' && addToSpouse && spouses.length > 0) ? spouses.map(s => s.id).join(',') : undefined,
          alsoAddToSiblingIds: (selectedRelationType === 'parent' && addToSiblings && siblings.length > 0) ? siblings.map(s => s.id).join(',') : undefined,
        },
      });
    }, [fromPersonId, selectedRelationType, router, addToSpouse, spouses, addToSiblings, siblings]);

    const handleLink = useCallback(() => {
      if (!fromPersonId || !selectedTargetPersonId) return;

      dispatch(addRelationship({
        fromPersonId,
        toPersonId: selectedTargetPersonId,
        type: selectedRelationType,
      }));

      if (selectedRelationType === 'child' && addToSpouse && spouses.length > 0) {
        spouses.forEach(sp => {
          dispatch(addRelationship({
            fromPersonId: sp.id,
            toPersonId: selectedTargetPersonId,
            type: 'child',
          }));
        });
      }

      if (selectedRelationType === 'parent' && addToSiblings && siblings.length > 0) {
        siblings.forEach(sibling => {
          dispatch(addRelationship({
            fromPersonId: sibling.id,
            toPersonId: selectedTargetPersonId,
            type: 'parent',
          }));
        });
      }

      bottomSheetRef.current?.dismiss();
      onComplete?.();
    }, [fromPersonId, selectedTargetPersonId, selectedRelationType, dispatch, onComplete, addToSpouse, spouses, addToSiblings, siblings]);

    const getIconComponent = (type: RelationshipType) => {
      switch (type) {
        case 'spouse': return Heart;
        case 'parent': return ArrowUp;
        case 'child': return Baby;
        case 'sibling': return Users;
      }
    };

    const showSpouseOption = selectedRelationType === 'child' && spouses.length > 0;
    const showSiblingsOption = selectedRelationType === 'parent' && siblings.length > 0;

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.neutrals500 }}
        backgroundStyle={{ backgroundColor: colors.neutrals1000 }}
        maxDynamicContentSize={600}
      >
        <BottomSheetView className="pb-10">
          <View className="border-b border-neutrals900 p-4">
            {fromPerson && (
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-neutrals700">
                  {fromPerson.avatarUrl ? (
                    <Image
                      source={{ uri: fromPerson.avatarUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={22} color={colors.neutrals400} />
                  )}
                </View>
                <View className="flex-1">
                  <AppText className="text-xs text-neutrals400">{t('PERSON.ADDING_RELATION_FOR')}</AppText>
                  <AppText className="font-semibold text-foreground">
                    {fromPerson.givenName}
                  </AppText>
                </View>
              </View>
            )}
          </View>

          <View className="p-4">
            <AppText className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutrals400">
              {t('PERSON.RELATIONSHIP_TYPE')}
            </AppText>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const isSelected = selectedRelationType === opt.value;
                const IconComponent = getIconComponent(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    className="flex-row items-center gap-1.5 rounded-full px-4 py-2"
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

            <View className="mb-3 flex-row items-center justify-between">
              <AppText className="text-xs font-semibold uppercase tracking-wide text-neutrals400">
                {t('PERSON.TARGET_PERSON')}
              </AppText>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={handleCreateNew}
              >
                <Plus size={14} color={colors.primary} />
                <AppText className="text-xs font-semibold text-primary">
                  {t('PERSON.CREATE_NEW')}
                </AppText>
              </TouchableOpacity>
            </View>

            {otherPersons.length > 0 ? (
              <View className="mb-4">
                <Select
                  placeholder={t('PERSON.SELECT_PERSON')}
                  value={selectedTargetPersonId || ''}
                  onValueChange={(val: string | number) => setSelectedTargetPersonId(val ? String(val) : null)}
                  options={otherPersons.map(p => ({
                    label: p.givenName,
                    value: p.id,
                  }))}
                  searchable
                />
              </View>
            ) : (
              <View className="mb-4 items-center rounded-xl bg-neutrals800 py-6">
                <Users size={24} color={colors.neutrals500} />
                <AppText className="mt-2 text-xs text-neutrals400">
                  {t('PERSON.NO_OTHER_PERSONS')}
                </AppText>
                <AppText className="text-xs text-neutrals500">
                  {t('PERSON.CREATE_NEW_HINT')}
                </AppText>
              </View>
            )}

            {showSpouseOption && (
              <TouchableOpacity
                className="mb-4 flex-row items-center gap-3 rounded-xl border p-3"
                style={{
                  backgroundColor: addToSpouse ? colors.primary + '15' : colors.neutrals900,
                  borderColor: addToSpouse ? colors.primary : colors.neutrals800,
                }}
                onPress={() => setAddToSpouse(!addToSpouse)}
              >
                <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutrals800">
                  {spouses.length === 1 && spouses[0].avatarUrl ? (
                    <Image
                      source={{ uri: spouses[0].avatarUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Heart size={20} color={colors.neutrals400} />
                  )}
                </View>
                <View className="flex-1">
                  <AppText className="text-xs text-neutrals400">
                    {spouses.length === 1
                      ? t('PERSON.ALSO_ADD_CHILD_OF_SPOUSE', { count: 1 })
                      : t('PERSON.ALSO_ADD_CHILD_OF_SPOUSES')
                    }
                  </AppText>
                  <AppText className="font-semibold text-foreground">
                    {spouses.length === 1
                      ? spouses[0].givenName
                      : `${spouses.length} ${t('RELATIONSHIP.SPOUSE').toLowerCase()}: ${spouses.map(s => s.givenName).join(', ')}`
                    }
                  </AppText>
                </View>
                <View
                  className="h-5 w-5 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: addToSpouse ? colors.primary : colors.neutrals600,
                    backgroundColor: addToSpouse ? colors.primary : 'transparent',
                  }}
                >
                  {addToSpouse && (
                    <View className="h-2 w-2 rounded-full bg-white" />
                  )}
                </View>
              </TouchableOpacity>
            )}

            {showSiblingsOption && (
              <TouchableOpacity
                className="mb-4 flex-row items-center gap-3 rounded-xl border p-3"
                style={{
                  backgroundColor: addToSiblings ? colors.primary + '15' : colors.neutrals900,
                  borderColor: addToSiblings ? colors.primary : colors.neutrals800,
                }}
                onPress={() => setAddToSiblings(!addToSiblings)}
              >
                <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutrals800">
                  <Users size={20} color={colors.neutrals400} />
                </View>
                <View className="flex-1">
                  <AppText className="text-xs text-neutrals400">
                    {t('PERSON.ALSO_ADD_PARENT_OF_SIBLINGS')}
                  </AppText>
                  <AppText className="font-semibold text-foreground">
                    {siblings.length > 1
                      ? t('PERSON.COUNT_SIBLINGS_PLURAL', { count: siblings.length })
                      : t('PERSON.COUNT_SIBLINGS', { count: siblings.length })
                    }: {siblings.map(s => s.givenName).join(', ')}
                  </AppText>
                </View>
                <View
                  className="h-5 w-5 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: addToSiblings ? colors.primary : colors.neutrals600,
                    backgroundColor: addToSiblings ? colors.primary : 'transparent',
                  }}
                >
                  {addToSiblings && (
                    <View className="h-2 w-2 rounded-full bg-white" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-3 px-4">
            <AppButton
              variant="ghost"
              onPress={() => bottomSheetRef.current?.dismiss()}
              className="flex-1"
            >
              {t('COMMON.CANCEL')}
            </AppButton>
            <AppButton
              variant="primary"
              onPress={handleLink}
              disabled={!selectedTargetPersonId}
              className="flex-1"
              icon={<Link size={16} color={colors.primaryForeground} />}
            >
              {t('COMMON.LINK')}
            </AppButton>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default AddRelationSheet;
