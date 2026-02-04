import React, { useRef, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAppSelector } from '@/store/hooks';
import { Person, Relationship } from '@/store/slices/familyTreeSlice';
import { User, Heart, Users, Baby, ArrowUp, Calendar, Cake, Edit3, Link, Trash2 } from 'lucide-react-native';

interface PersonDetailSheetProps {
  onEdit?: (person: Person) => void;
  onAddRelation?: (person: Person) => void;
  onPersonSelect?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export interface PersonDetailSheetRef {
  open: (person: Person) => void;
  close: () => void;
}

interface RelationGroup {
  type: 'spouse' | 'parent' | 'child' | 'sibling';
  label: string;
  icon: React.ReactNode;
  color: string;
  persons: Person[];
}

const PersonDetailSheet = forwardRef<PersonDetailSheetRef, PersonDetailSheetProps>(
  ({ onEdit, onAddRelation, onPersonSelect, onDelete }, ref) => {
    const colors = useColors();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [currentPerson, setCurrentPerson] = React.useState<Person | null>(null);

    const { persons, relationships } = useAppSelector((state) => state.familyTree);

    useImperativeHandle(ref, () => ({
      open: (person: Person) => {
        setCurrentPerson(person);
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

    const relationGroups = useMemo((): RelationGroup[] => {
      if (!currentPerson) return [];

      const findRelatedPersons = (type: 'spouse' | 'parent' | 'child' | 'sibling'): Person[] => {
        const relatedIds: string[] = [];

        relationships.forEach((rel: Relationship) => {
          if (rel.type === type) {
            if (rel.fromPersonId === currentPerson.id) {
              relatedIds.push(rel.toPersonId);
            } else if (rel.toPersonId === currentPerson.id) {
              if (type === 'spouse' || type === 'sibling') {
                relatedIds.push(rel.fromPersonId);
              } else if (type === 'parent') {
                relatedIds.push(rel.fromPersonId);
              } else if (type === 'child') {
                relatedIds.push(rel.fromPersonId);
              }
            }
          }
          if (type === 'parent' && rel.type === 'child' && rel.toPersonId === currentPerson.id) {
            relatedIds.push(rel.fromPersonId);
          }
          if (type === 'child' && rel.type === 'parent' && rel.toPersonId === currentPerson.id) {
            relatedIds.push(rel.fromPersonId);
          }
        });

        return persons.filter((p) => relatedIds.includes(p.id));
      };

      const groups: RelationGroup[] = [
        {
          type: 'spouse',
          label: 'Spouse',
          icon: <Heart size={16} color="#EC4899" fill="#EC4899" />,
          color: '#EC4899',
          persons: findRelatedPersons('spouse'),
        },
        {
          type: 'parent',
          label: 'Parents',
          icon: <ArrowUp size={16} color="#3B82F6" />,
          color: '#3B82F6',
          persons: findRelatedPersons('parent'),
        },
        {
          type: 'child',
          label: 'Children',
          icon: <Baby size={16} color="#10B981" />,
          color: '#10B981',
          persons: findRelatedPersons('child'),
        },
        {
          type: 'sibling',
          label: 'Siblings',
          icon: <Users size={16} color="#F59E0B" />,
          color: '#F59E0B',
          persons: findRelatedPersons('sibling'),
        },
      ];

      return groups.filter((g) => g.persons.length > 0);
    }, [currentPerson, persons, relationships]);

    const handlePersonTap = (person: Person) => {
      setCurrentPerson(person);
      onPersonSelect?.(person);
    };

    const handleDelete = () => {
      if (!currentPerson) return;
      Alert.alert(
        'Delete Person',
        `Are you sure you want to delete ${currentPerson.givenName}? This will also remove all their relationships.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete?.(currentPerson);
              bottomSheetRef.current?.dismiss();
            },
          },
        ]
      );
    };

    if (!currentPerson) return null;

    const borderColor = currentPerson.gender === 'male'
      ? '#3B82F6'
      : currentPerson.gender === 'female'
        ? '#EC4899'
        : '#9CA3AF';

    const age = currentPerson.birthday
      ? Math.floor((new Date().getTime() - new Date(currentPerson.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.neutrals500 }}
        backgroundStyle={{ backgroundColor: colors.neutrals900 }}
        maxDynamicContentSize={700}
      >
        <View className="flex-1" style={{ backgroundColor: colors.neutrals900 }}>
          <BottomSheetScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center pb-6">
              <View
                className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4"
                style={{ borderColor, backgroundColor: colors.neutrals800 }}
              >
                {currentPerson.avatarUrl ? (
                  <Image
                    source={{ uri: currentPerson.avatarUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <User size={40} color={colors.neutrals400} />
                )}
              </View>

              <AppText className="mt-4 text-2xl font-bold" style={{ color: colors.foreground }}>
                {currentPerson.givenName}
              </AppText>

              <View className="mt-2 flex-row items-center gap-3">
                {currentPerson.birthday && (
                  <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: colors.neutrals800 }}>
                    <Cake size={14} color={colors.neutrals400} />
                    <AppText className="text-xs" style={{ color: colors.neutrals300 }}>
                      {currentPerson.birthday}
                    </AppText>
                  </View>
                )}
                {age !== null && (
                  <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: colors.neutrals800 }}>
                    <Calendar size={14} color={colors.neutrals400} />
                    <AppText className="text-xs" style={{ color: colors.neutrals300 }}>
                      {age} years old
                    </AppText>
                  </View>
                )}
              </View>

              {currentPerson.dateOfDeath && (
                <View className="mt-2 flex-row items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: '#64748B20' }}>
                  <AppText className="text-xs" style={{ color: '#64748B' }}>
                    Passed away: {currentPerson.dateOfDeath}
                  </AppText>
                </View>
              )}
            </View>

            <View className="mb-4 flex-row gap-3">
              <AppButton
                variant="secondary"
                onPress={() => onEdit?.(currentPerson)}
                className="flex-1"
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Edit3 size={16} color={colors.foreground} />
                  <AppText className="font-semibold" style={{ color: colors.foreground }}>Edit</AppText>
                </View>
              </AppButton>
              <AppButton
                variant="primary"
                onPress={() => onAddRelation?.(currentPerson)}
                className="flex-1"
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Link size={16} color={colors.primaryForeground} />
                  <AppText className="font-semibold" style={{ color: colors.primaryForeground }}>Add Relation</AppText>
                </View>
              </AppButton>
            </View>

            <TouchableOpacity
              className="mb-4 flex-row items-center justify-center gap-2 rounded-xl border py-3"
              style={{ borderColor: '#EF444440', backgroundColor: '#EF444410' }}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#EF4444" />
              <AppText className="font-semibold" style={{ color: '#EF4444' }}>Delete Person</AppText>
            </TouchableOpacity>

            {relationGroups.length > 0 ? (
              <View>
                <AppText className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.neutrals400 }}>
                  Relations
                </AppText>

                {relationGroups.map((group) => (
                  <View key={group.type} className="mb-4">
                    <View className="mb-2 flex-row items-center gap-2">
                      {group.icon}
                      <AppText className="text-sm font-semibold" style={{ color: group.color }}>
                        {group.label} ({group.persons.length})
                      </AppText>
                    </View>

                    <View className="gap-2">
                      {group.persons.map((person) => (
                        <TouchableOpacity
                          key={person.id}
                          className="flex-row items-center gap-3 rounded-xl border p-3"
                          style={{ backgroundColor: colors.neutrals800, borderColor: colors.neutrals700 }}
                          onPress={() => handlePersonTap(person)}
                          activeOpacity={0.7}
                        >
                          <View
                            className="h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                            style={{ backgroundColor: colors.neutrals700 }}
                          >
                            {person.avatarUrl ? (
                              <Image
                                source={{ uri: person.avatarUrl }}
                                className="h-full w-full"
                                resizeMode="cover"
                              />
                            ) : (
                              <User size={20} color={colors.neutrals400} />
                            )}
                          </View>
                          <View className="flex-1">
                            <AppText className="font-semibold" style={{ color: colors.foreground }}>
                              {person.givenName}
                            </AppText>
                            {person.birthday && (
                              <AppText className="text-xs" style={{ color: colors.neutrals400 }}>
                                {person.birthday}
                              </AppText>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center rounded-2xl border py-8" style={{ backgroundColor: colors.neutrals800, borderColor: colors.neutrals700 }}>
                <Users size={32} color={colors.neutrals500} />
                <AppText className="mt-3 text-sm" style={{ color: colors.neutrals400 }}>
                  No relations yet
                </AppText>
                <AppText className="mt-1 text-xs" style={{ color: colors.neutrals500 }}>
                  Tap "Add Relation" to connect family members
                </AppText>
              </View>
            )}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  }
);

export default PersonDetailSheet;
