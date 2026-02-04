import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RelationshipType, Person } from '@/store/slices/familyTreeSlice';
import { Heart, ArrowUp, Baby, Users } from 'lucide-react-native';
import { AppText } from '@/components/ui';

interface RelationshipLineProps {
  fromPerson: Person;
  toPerson: Person;
  type: RelationshipType;
  canvasWidth: number;
  canvasHeight: number;
  index?: number;
  totalSameType?: number;
}

const RELATIONSHIP_STYLES: Record<RelationshipType, {
  color: string;
  translationKey: string;
  dashArray?: string;
}> = {
  spouse: { color: '#EC4899', translationKey: 'RELATIONSHIP.SPOUSE', dashArray: '8,4' },
  parent: { color: '#3B82F6', translationKey: 'RELATIONSHIP.PARENT' },
  child: { color: '#10B981', translationKey: 'RELATIONSHIP.CHILD' },
  sibling: { color: '#F59E0B', translationKey: 'RELATIONSHIP.SIBLING', dashArray: '4,4' },
};

const RelationshipIcon = ({ type }: { type: RelationshipType }) => {
  const size = 12;
  switch (type) {
    case 'spouse':
      return <Heart size={size} color="#fff" fill="#fff" />;
    case 'parent':
      return <ArrowUp size={size} color="#fff" />;
    case 'child':
      return <Baby size={size} color="#fff" />;
    case 'sibling':
      return <Users size={size} color="#fff" />;
  }
};

export default function RelationshipLine({
  fromPerson,
  toPerson,
  type,
  canvasWidth,
  canvasHeight,
  index = 0,
  totalSameType = 1,
}: RelationshipLineProps) {
  const { t } = useTranslation();
  const style = RELATIONSHIP_STYLES[type];

  const x1 = fromPerson.position.x;
  const y1 = fromPerson.position.y;
  const x2 = toPerson.position.x;
  const y2 = toPerson.position.y;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  let pathData: string;
  let labelX = midX;
  let labelY = midY;

  if (type === 'spouse') {
    pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else if (type === 'parent' || type === 'child') {
    const verticalMid = midY;
    pathData = `M ${x1} ${y1} L ${x1} ${verticalMid} L ${x2} ${verticalMid} L ${x2} ${y2}`;
    labelY = verticalMid;
  } else {
    pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  const gradientId = `gradient_${fromPerson.id}_${toPerson.id}`;

  return (
    <>
      <Svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvasWidth,
          height: canvasHeight,
          pointerEvents: 'none',
        }}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={style.color} stopOpacity={0.3} />
            <Stop offset="50%" stopColor={style.color} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={style.color} stopOpacity={0.3} />
          </LinearGradient>
        </Defs>

        <Path
          d={pathData}
          stroke={`url(#${gradientId})`}
          strokeWidth={2}
          strokeDasharray={style.dashArray}
          fill="none"
          strokeLinecap="round"
        />

        <Circle
          cx={x1}
          cy={y1}
          r={4}
          fill={style.color}
          opacity={0.6}
        />
        <Circle
          cx={x2}
          cy={y2}
          r={4}
          fill={style.color}
          opacity={0.6}
        />
      </Svg>

      <View
        className="absolute flex-row items-center gap-1 rounded-lg px-2 py-1"
        style={{
          left: labelX - 30,
          top: labelY - 10,
          backgroundColor: style.color,
        }}
        pointerEvents="none"
      >
        <RelationshipIcon type={type} />
        <AppText className="text-[10px] font-semibold text-white">{t(style.translationKey)}</AppText>
      </View>
    </>
  );
}
