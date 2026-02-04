import React from 'react';
import { View, Image, TouchableOpacity, Pressable } from 'react-native';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { Person } from '@/store/slices/familyTreeSlice';
import { User } from 'lucide-react-native';

interface PersonNodeProps {
  person: Person;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

function getLastTwoWords(givenName: string): string {
  const words = givenName.trim().split(/\s+/);
  if (words.length <= 2) return givenName;
  return words.slice(-2).join(' ');
}

function GenderIcon({ gender, size, color }: { gender: string; size: number; color: string }) {
  if (gender === 'male') {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <AppText style={{ color, fontSize: size - 2 }}>♂</AppText>
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <AppText style={{ color, fontSize: size - 2 }}>♀</AppText>
    </View>
  );
}

export default function PersonNode({
  person,
  onPress,
  onLongPress,
}: PersonNodeProps) {
  const colors = useColors();

  const displayName = getLastTwoWords(person.givenName);
  const isMale = person.gender === 'male';
  const genderColor = isMale ? '#3B82F6' : '#EC4899';

  const AVATAR_SIZE = 72;
  const NODE_WIDTH = 100;
  const NODE_HEIGHT = 120;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="absolute items-center"
      style={{
        width: NODE_WIDTH,
        left: person.position.x - (NODE_WIDTH / 2),
        top: person.position.y - (NODE_HEIGHT / 2),
      }}
    >
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          backgroundColor: '#2A2A2A',
        }}
      >
        {person.avatarUrl ? (
          <Image
            source={{ uri: person.avatarUrl }}
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            resizeMode="cover"
          />
        ) : (
          <User size={32} color="#5A5A5A" strokeWidth={1.5} />
        )}
      </View>

      <View
        className="mt-2 flex-row items-center rounded-xl px-3 py-1.5"
        style={{ backgroundColor: '#2A2A2A' }}
      >
        <AppText style={{ color: genderColor, fontSize: 14, marginRight: 4 }}>
          {isMale ? '♂' : '♀'}
        </AppText>
        <AppText
          numberOfLines={1}
          className="text-sm font-medium"
          style={{ color: '#FFFFFF' }}
        >
          {displayName}
        </AppText>
      </View>
    </Pressable>
  );
}

