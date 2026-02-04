import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAppSelector } from '@/store/hooks';
import { Person } from '@/store/slices/familyTreeSlice';
import { AppText } from '@/components/ui';
import { User, ChevronDown, ChevronRight, Heart, Users, Baby, UsersRound } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

interface FamilyNode {
  person: Person;
  spouses: Person[];
  children: Person[];
  parents: Person[];
  siblings: Person[];
}

export default function PeopleListView() {
  const colors = useColors();
  const { persons, relationships } = useAppSelector((state) => state.familyTree);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const familyNodes = useMemo(() => {
    const nodes: Map<string, FamilyNode> = new Map();

    persons.forEach((person) => {
      const spouses: Person[] = [];
      const children: Person[] = [];
      const parents: Person[] = [];
      const siblings: Person[] = [];

      relationships.forEach((rel) => {
        if (rel.fromPersonId === person.id) {
          const relatedPerson = persons.find((p) => p.id === rel.toPersonId);
          if (relatedPerson) {
            switch (rel.type) {
              case 'spouse':
                spouses.push(relatedPerson);
                break;
              case 'child':
                children.push(relatedPerson);
                break;
              case 'parent':
                parents.push(relatedPerson);
                break;
              case 'sibling':
                siblings.push(relatedPerson);
                break;
            }
          }
        }
        if (rel.toPersonId === person.id) {
          const relatedPerson = persons.find((p) => p.id === rel.fromPersonId);
          if (relatedPerson) {
            switch (rel.type) {
              case 'spouse':
                spouses.push(relatedPerson);
                break;
              case 'child':
                parents.push(relatedPerson);
                break;
              case 'parent':
                children.push(relatedPerson);
                break;
              case 'sibling':
                siblings.push(relatedPerson);
                break;
            }
          }
        }
      });

      nodes.set(person.id, { person, spouses, children, parents, siblings });
    });

    return nodes;
  }, [persons, relationships]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const getRelationshipCount = (node: FamilyNode) => {
    return node.spouses.length + node.children.length + node.parents.length + node.siblings.length;
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return '#3B82F6';
      case 'female':
        return '#EC4899';
      default:
        return '#EAB308';
    }
  };

  const renderRelationshipSection = (
    title: string,
    icon: React.ReactNode,
    people: Person[],
    color: string
  ) => {
    if (people.length === 0) return null;
    return (
      <View className="gap-2">
        <View className="flex-row items-center gap-1.5">
          {icon}
          <AppText className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
            {title}
          </AppText>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {people.map((p) => (
            <View
              key={p.id}
              className="flex-row items-center gap-1.5 rounded-full border px-2.5 py-1.5"
              style={{ backgroundColor: color + '20', borderColor: color + '40' }}
            >
              <View className="h-4.5 w-4.5 items-center justify-center rounded-full bg-neutrals700">
                {p.avatarUrl ? (
                  <Image source={{ uri: p.avatarUrl }} className="h-4.5 w-4.5 rounded-full" />
                ) : (
                  <User size={10} color={colors.neutrals400} />
                )}
              </View>
              <AppText className="text-xs font-medium text-foreground" numberOfLines={1}>
                {p.givenName}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPersonCard = (person: Person) => {
    const node = familyNodes.get(person.id);
    if (!node) return null;

    const isExpanded = expandedIds.has(person.id);
    const relationCount = getRelationshipCount(node);
    const hasRelations = relationCount > 0;

    return (
      <Animated.View
        key={person.id}
        layout={Layout.springify()}
        className="overflow-hidden rounded-2xl border border-neutrals700 bg-neutrals800"
      >
        <TouchableOpacity
          className="flex-row items-center justify-between p-3.5"
          onPress={() => hasRelations && toggleExpand(person.id)}
          activeOpacity={hasRelations ? 0.7 : 1}
        >
          <View className="flex-1 flex-row items-center gap-3">
            <View
              className="h-11 w-11 items-center justify-center rounded-full border-2 bg-neutrals700"
              style={{ borderColor: getGenderColor(person.gender) }}
            >
              {person.avatarUrl ? (
                <Image source={{ uri: person.avatarUrl }} className="h-10 w-10 rounded-full" />
              ) : (
                <User size={20} color={colors.neutrals400} />
              )}
            </View>
            <View className="flex-1">
              <AppText className="text-base font-semibold text-foreground">
                {person.givenName}
              </AppText>
              <View className="mt-0.5 flex-row gap-2.5">
                {person.birthday && (
                  <AppText className="text-xs text-neutrals400">
                    {person.birthday}
                  </AppText>
                )}
                {person.dateOfDeath && (
                  <AppText className="text-xs text-neutrals500">
                    † {person.dateOfDeath}
                  </AppText>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {hasRelations && (
              <View className="rounded-lg px-2 py-1" style={{ backgroundColor: colors.primary + '20' }}>
                <AppText className="text-xs font-semibold" style={{ color: colors.primary }}>
                  {relationCount}
                </AppText>
              </View>
            )}
            {hasRelations && (
              isExpanded ? (
                <ChevronDown size={20} color={colors.neutrals400} />
              ) : (
                <ChevronRight size={20} color={colors.neutrals400} />
              )
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && hasRelations && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            className="gap-3 border-t border-neutrals700 p-3.5 pt-3"
          >
            {renderRelationshipSection(
              'Spouses',
              <Heart size={14} color="#EC4899" />,
              node.spouses,
              '#EC4899'
            )}
            {renderRelationshipSection(
              'Parents',
              <Users size={14} color="#3B82F6" />,
              node.parents,
              '#3B82F6'
            )}
            {renderRelationshipSection(
              'Children',
              <Baby size={14} color="#10B981" />,
              node.children,
              '#10B981'
            )}
            {renderRelationshipSection(
              'Siblings',
              <UsersRound size={14} color="#F59E0B" />,
              node.siblings,
              '#F59E0B'
            )}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="bg-neutrals900 px-5 pb-4 pt-14">
        <View className="flex-row items-center gap-2.5">
          <Users size={24} color={colors.primary} />
          <AppText className="text-2xl font-bold text-foreground">
            Family Members
          </AppText>
        </View>
        <AppText className="mt-1 text-sm text-neutrals400">
          {persons.length} {persons.length === 1 ? 'person' : 'people'}
        </AppText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {persons.length === 0 ? (
          <View className="items-center justify-center gap-3 py-20">
            <Users size={48} color={colors.neutrals600} />
            <AppText className="text-lg font-semibold text-neutrals400">
              No family members yet
            </AppText>
            <AppText className="text-sm text-neutrals500">
              Add people using the Map view
            </AppText>
          </View>
        ) : (
          persons.map(renderPersonCard)
        )}
      </ScrollView>
    </View>
  );
}
