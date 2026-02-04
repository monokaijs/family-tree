import React, { useMemo, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Person, Relationship, removePerson, setSelectedPerson } from '@/store/slices/familyTreeSlice';
import { User, Heart, Users, X, Mars, Venus, HeartOff, Trash2, Edit3, Link, Calendar, Cake, Phone, MapPin, Building2 } from 'lucide-react-native';
import AddRelationSheet, { AddRelationSheetRef } from '@/components/tree/AddRelationSheet';

interface RelationItem {
  person: Person;
  relationshipType: string;
  relationshipLabel: string;
}

export default function PersonDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ personId?: string }>();
  const addRelationSheetRef = useRef<AddRelationSheetRef>(null);

  const { persons, relationships } = useAppSelector((state) => state.familyTree);
  const currentPerson = persons.find(p => p.id === params.personId);

  const allRelations = useMemo((): RelationItem[] => {
    if (!currentPerson) return [];

    const result: RelationItem[] = [];
    const addedPersonIds = new Set<string>();

    const getRelationshipLabel = (type: string, gender?: string): string => {
      switch (type) {
        case 'spouse': return gender === 'male' ? t('RELATIONSHIP.HUSBAND') : t('RELATIONSHIP.WIFE');
        case 'parent': return gender === 'male' ? t('RELATIONSHIP.FATHER') : t('RELATIONSHIP.MOTHER');
        case 'child': return gender === 'male' ? t('RELATIONSHIP.SON') : t('RELATIONSHIP.DAUGHTER');
        case 'sibling': return gender === 'male' ? t('RELATIONSHIP.BROTHER') : t('RELATIONSHIP.SISTER');
        default: return type;
      }
    };

    relationships.forEach((rel: Relationship) => {
      let relatedPersonId: string | null = null;
      let relType = rel.type;

      if (rel.fromPersonId === currentPerson.id) {
        relatedPersonId = rel.toPersonId;
      } else if (rel.toPersonId === currentPerson.id) {
        relatedPersonId = rel.fromPersonId;
        if (rel.type === 'parent') {
          relType = 'child';
        } else if (rel.type === 'child') {
          relType = 'parent';
        }
      }

      if (relatedPersonId && !addedPersonIds.has(relatedPersonId)) {
        const relatedPerson = persons.find(p => p.id === relatedPersonId);
        if (relatedPerson) {
          addedPersonIds.add(relatedPersonId);
          result.push({
            person: relatedPerson,
            relationshipType: relType,
            relationshipLabel: getRelationshipLabel(relType, relatedPerson.gender),
          });
        }
      }
    });

    return result;
  }, [currentPerson, persons, relationships, t]);

  const getAgeOrStatus = (person: Person): string => {
    if (person.dateOfDeath) {
      return t('COMMON.DECEASED');
    }
    if (person.birthday) {
      const birthDate = new Date(person.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return t('COMMON.YEARS_OLD', { age });
    }
    return '';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handlePersonTap = (person: Person) => {
    router.replace({
      pathname: '/person-detail',
      params: { personId: person.id },
    });
  };

  const handleEdit = () => {
    if (!currentPerson) return;
    router.push({
      pathname: '/person-form',
      params: { mode: 'edit', personId: currentPerson.id },
    });
  };

  const handleAddRelation = () => {
    if (!currentPerson) return;
    addRelationSheetRef.current?.open(currentPerson.id);
  };

  const handleDelete = () => {
    if (!currentPerson) return;
    Alert.alert(
      t('PERSON.DELETE_PERSON'),
      t('PERSON.DELETE_CONFIRM_RELATIONS', { name: currentPerson.givenName }),
      [
        { text: t('COMMON.CANCEL'), style: 'cancel' },
        {
          text: t('COMMON.DELETE'),
          style: 'destructive',
          onPress: () => {
            dispatch(removePerson(currentPerson.id));
            dispatch(setSelectedPerson(null));
            router.back();
          },
        },
      ]
    );
  };

  if (!currentPerson) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <AppText className="text-neutrals400">{t('PERSON.NOT_FOUND')}</AppText>
      </View>
    );
  }

  const genderIcon = currentPerson.gender === 'male'
    ? <Mars size={16} color="#3B82F6" />
    : <Venus size={16} color="#EC4899" />;

  const currentPersonAge = getAgeOrStatus(currentPerson);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-neutrals800 px-4 pb-4 pt-[60px]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold text-foreground">
          {t('COMMON.DETAILS')}
        </AppText>
        <TouchableOpacity onPress={handleDelete} className="p-2">
          <Trash2 size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="items-center pb-5">
          <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutrals800">
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

          <AppText className="mt-3 text-xl font-bold text-foreground">
            {currentPerson.givenName}
          </AppText>
        </View>

        <View className="mb-5">
          <AppText className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutrals400">
            {t('COMMON.INFORMATION')}
          </AppText>
          <View className="overflow-hidden rounded-xl border border-neutrals900 bg-neutrals1000">
            <View className="flex-row items-center gap-3 border-b border-neutrals900 p-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                {genderIcon}
              </View>
              <View>
                <AppText className="text-xs text-neutrals400">{t('PERSON.GENDER')}</AppText>
                <AppText className="font-semibold text-foreground">
                  {currentPerson.gender === 'male' ? t('PERSON.MALE') : t('PERSON.FEMALE')}
                </AppText>
              </View>
            </View>

            <View className="flex-row items-center gap-3 border-b border-neutrals900 p-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                <Cake size={22} color={colors.neutrals400} />
              </View>
              <View>
                <AppText className="text-xs text-neutrals400">{t('PERSON.BIRTHDAY')}</AppText>
                <AppText className="font-semibold text-foreground">
                  {currentPerson.birthday
                    ? formatDate(currentPerson.birthday)
                    : t('COMMON.NOT_SET')}
                </AppText>
              </View>
            </View>

            <View className={`flex-row items-center gap-3 p-3 ${currentPerson.dateOfDeath || currentPerson.phoneNumber || currentPerson.address || currentPerson.workplace ? 'border-b border-neutrals900' : ''}`}>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                <Calendar size={22} color={colors.neutrals400} />
              </View>
              <View>
                <AppText className="text-xs text-neutrals400">{t('PERSON.AGE')}</AppText>
                <AppText className="font-semibold text-foreground">
                  {currentPersonAge || t('COMMON.UNKNOWN')}
                </AppText>
              </View>
            </View>

            {currentPerson.dateOfDeath && (
              <View className={`flex-row items-center gap-3 p-3 ${currentPerson.phoneNumber || currentPerson.address || currentPerson.workplace ? 'border-b border-neutrals900' : ''}`}>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                  <HeartOff size={22} color="#64748B" />
                </View>
                <View>
                  <AppText className="text-xs text-neutrals400">{t('PERSON.DATE_OF_DEATH')}</AppText>
                  <AppText className="font-semibold text-slate-500">
                    {currentPerson.dateOfDeath === 'unknown' ? t('COMMON.UNKNOWN') : currentPerson.dateOfDeath}
                  </AppText>
                </View>
              </View>
            )}

            {currentPerson.phoneNumber && (
              <View className={`flex-row items-center gap-3 p-3 ${currentPerson.address || currentPerson.workplace ? 'border-b border-neutrals900' : ''}`}>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                  <Phone size={22} color={colors.neutrals400} />
                </View>
                <View>
                  <AppText className="text-xs text-neutrals400">{t('PERSON.PHONE')}</AppText>
                  <AppText className="font-semibold text-foreground">
                    {currentPerson.phoneNumber}
                  </AppText>
                </View>
              </View>
            )}

            {currentPerson.address && (
              <View className={`flex-row items-center gap-3 p-3 ${currentPerson.workplace ? 'border-b border-neutrals900' : ''}`}>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                  <MapPin size={22} color={colors.neutrals400} />
                </View>
                <View className="flex-1">
                  <AppText className="text-xs text-neutrals400">{t('PERSON.ADDRESS')}</AppText>
                  <AppText className="font-semibold text-foreground">
                    {currentPerson.address}
                  </AppText>
                </View>
              </View>
            )}

            {currentPerson.workplace && (
              <View className="flex-row items-center gap-3 p-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-neutrals800">
                  <Building2 size={22} color={colors.neutrals400} />
                </View>
                <View className="flex-1">
                  <AppText className="text-xs text-neutrals400">{t('PERSON.WORKPLACE')}</AppText>
                  <AppText className="font-semibold text-foreground">
                    {currentPerson.workplace}
                  </AppText>
                </View>
              </View>
            )}
          </View>
        </View>

        <View className="mb-5">
          <AppText className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutrals400">
            {t('TREE_VIEW.DIRECT_RELATIONS')} ({allRelations.length})
          </AppText>

          {allRelations.length > 0 ? (
            <View className="overflow-hidden rounded-xl border border-neutrals900 bg-neutrals1000">
              {allRelations.map((item, index) => {
                const ageStatus = getAgeOrStatus(item.person);
                const isLast = index === allRelations.length - 1;
                const genderIcon = item.person.gender === 'male'
                  ? <Mars size={12} color="#3B82F6" />
                  : <Venus size={12} color="#EC4899" />;
                return (
                  <TouchableOpacity
                    key={item.person.id}
                    className={`flex-row items-center gap-3 p-3 ${!isLast ? 'border-b border-neutrals900' : ''}`}
                    onPress={() => handlePersonTap(item.person)}
                    activeOpacity={0.7}
                  >
                    <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-neutrals800">
                      {item.person.avatarUrl ? (
                        <Image
                          source={{ uri: item.person.avatarUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <User size={22} color={colors.neutrals400} />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <AppText className="font-semibold text-foreground">
                          {item.person.givenName}
                        </AppText>
                        {genderIcon}
                      </View>
                      <View className="mt-0.5 flex-row items-center gap-1.5">
                        <AppText className="text-xs text-neutrals400">
                          {item.relationshipLabel}
                        </AppText>
                        {ageStatus && (
                          <>
                            <AppText className="text-xs text-neutrals600">•</AppText>
                            <AppText className={`text-xs ${item.person.dateOfDeath ? 'text-slate-500' : 'text-neutrals500'}`}>
                              {ageStatus}
                            </AppText>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="items-center rounded-2xl border border-neutrals700 bg-neutrals800 py-8">
              <Users size={32} color={colors.neutrals500} />
              <AppText className="mt-3 text-sm text-neutrals400">
                {t('TREE_VIEW.NO_RELATIONS')}
              </AppText>
              <AppText className="mt-1 text-xs text-neutrals500">
                {t('TREE_VIEW.NO_RELATIONS_HINT')}
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-neutrals800 bg-background px-5 pb-8 pt-4">
        <AppButton
          variant="ghost"
          onPress={handleEdit}
          className="flex-1"
          icon={<Edit3 size={16} color={colors.foreground} />}
        >
          {t('COMMON.EDIT')}
        </AppButton>
        <AppButton
          variant="primary"
          onPress={handleAddRelation}
          className="flex-1"
          icon={<Link size={16} color={colors.primaryForeground} />}
        >
          {t('PERSON.ADD_RELATION')}
        </AppButton>
      </View>

      <AddRelationSheet ref={addRelationSheetRef} />
    </View>
  );
}
