import React from 'react';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { Person, Relationship } from '@/store/slices/familyTreeSlice';
import { AppText } from '@/components/ui';
import { Heart, Baby } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface FamilyConnectorProps {
  parent1: Person;
  parent2: Person;
  children: Person[];
  canvasWidth: number;
  canvasHeight: number;
}

const SPOUSE_COLOR = '#EC4899';
const CHILD_COLOR = '#10B981';

export default function FamilyConnector({
  parent1,
  parent2,
  children,
  canvasWidth,
  canvasHeight,
}: FamilyConnectorProps) {
  const { t } = useTranslation();

  const p1x = parent1.position.x;
  const p1y = parent1.position.y;
  const p2x = parent2.position.x;
  const p2y = parent2.position.y;

  const spouseMidX = (p1x + p2x) / 2;
  const spouseMidY = (p1y + p2y) / 2;

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
          <LinearGradient id={`spouseGrad_${parent1.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={SPOUSE_COLOR} stopOpacity={0.5} />
            <Stop offset="50%" stopColor={SPOUSE_COLOR} stopOpacity={1} />
            <Stop offset="100%" stopColor={SPOUSE_COLOR} stopOpacity={0.5} />
          </LinearGradient>
          <LinearGradient id={`childGrad_${parent1.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={CHILD_COLOR} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={CHILD_COLOR} stopOpacity={0.5} />
          </LinearGradient>
        </Defs>

        <Line
          x1={p1x}
          y1={p1y}
          x2={p2x}
          y2={p2y}
          stroke={`url(#spouseGrad_${parent1.id})`}
          strokeWidth={3}
          strokeDasharray="8,4"
        />
        <Circle cx={p1x} cy={p1y} r={5} fill={SPOUSE_COLOR} opacity={0.7} />
        <Circle cx={p2x} cy={p2y} r={5} fill={SPOUSE_COLOR} opacity={0.7} />

        {children.map((child) => {
          const midY = spouseMidY + (child.position.y - spouseMidY) / 2;
          const pathData = `M ${spouseMidX} ${spouseMidY} L ${spouseMidX} ${midY} L ${child.position.x} ${midY} L ${child.position.x} ${child.position.y}`;

          return (
            <React.Fragment key={child.id}>
              <Path
                d={pathData}
                stroke={`url(#childGrad_${parent1.id})`}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
              <Circle
                cx={child.position.x}
                cy={child.position.y}
                r={4}
                fill={CHILD_COLOR}
                opacity={0.6}
              />
            </React.Fragment>
          );
        })}

        {children.length > 0 && (
          <Circle cx={spouseMidX} cy={spouseMidY} r={5} fill={CHILD_COLOR} />
        )}
      </Svg>

      <View
        className="absolute flex-row items-center gap-1 rounded-lg px-2 py-1"
        style={{
          left: spouseMidX - 30,
          top: spouseMidY - 24,
          backgroundColor: SPOUSE_COLOR,
        }}
        pointerEvents="none"
      >
        <Heart size={10} color="#fff" fill="#fff" />
        <AppText className="text-[9px] font-semibold text-white">{t('RELATIONSHIP.SPOUSE')}</AppText>
      </View>

      {children.map((child) => {
        const labelX = (spouseMidX + child.position.x) / 2;
        const labelY = (spouseMidY + child.position.y) / 2;

        return (
          <View
            key={`label_${child.id}`}
            className="absolute flex-row items-center gap-1 rounded-lg px-2 py-1"
            style={{
              left: labelX - 25,
              top: labelY - 10,
              backgroundColor: CHILD_COLOR,
            }}
            pointerEvents="none"
          >
            <Baby size={10} color="#fff" />
            <AppText className="text-[9px] font-semibold text-white">{t('RELATIONSHIP.CHILD')}</AppText>
          </View>
        );
      })}
    </>
  );
}

export interface FamilyUnit {
  id: string;
  parent1: Person;
  parent2: Person;
  children: Person[];
}

export function buildFamilyUnits(persons: Person[], relationships: Relationship[]): {
  familyUnits: FamilyUnit[];
  handledRelationshipIds: Set<string>;
} {
  const familyUnits: FamilyUnit[] = [];
  const handledRelationshipIds = new Set<string>();

  const spouseRelations = relationships.filter(r => r.type === 'spouse');

  spouseRelations.forEach((spouseRel) => {
    const parent1 = persons.find(p => p.id === spouseRel.fromPersonId);
    const parent2 = persons.find(p => p.id === spouseRel.toPersonId);

    if (!parent1 || !parent2) return;

    const alreadyExists = familyUnits.some(
      u => (u.parent1.id === parent1.id && u.parent2.id === parent2.id) ||
        (u.parent1.id === parent2.id && u.parent2.id === parent1.id)
    );
    if (alreadyExists) return;

    const parentIds = new Set([parent1.id, parent2.id]);
    const childIds = new Set<string>();

    relationships.forEach((rel) => {
      if (rel.type === 'child' && parentIds.has(rel.fromPersonId)) {
        const child = persons.find(p => p.id === rel.toPersonId);
        if (child && child.position.y > Math.max(parent1.position.y, parent2.position.y)) {
          childIds.add(rel.toPersonId);
          handledRelationshipIds.add(rel.id);
        }
      }
      if (rel.type === 'parent' && parentIds.has(rel.toPersonId)) {
        const child = persons.find(p => p.id === rel.fromPersonId);
        if (child && child.position.y > Math.max(parent1.position.y, parent2.position.y)) {
          childIds.add(rel.fromPersonId);
          handledRelationshipIds.add(rel.id);
        }
      }
    });

    const childPersons = persons.filter(p => childIds.has(p.id));

    familyUnits.push({
      id: `${parent1.id}_${parent2.id}`,
      parent1,
      parent2,
      children: childPersons,
    });

    handledRelationshipIds.add(spouseRel.id);
  });

  return { familyUnits, handledRelationshipIds };
}
