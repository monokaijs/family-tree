import { Person, Relationship } from '@/store/slices/familyTreeSlice';
import { calculateTreeLayout, getTreeConnectors, NODE_WIDTH, NODE_HEIGHT } from './treeLayout';

const LEVEL_HEIGHT = 180;
const PERSON_WIDTH = 150;

export interface PersonLevel {
  personId: string;
  level: number;
}

export function calculateLevels(
  persons: Person[],
  relationships: Relationship[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  if (persons.length === 0) return levels;

  const firstPerson = persons[0];
  levels.set(firstPerson.id, 0);
  visited.add(firstPerson.id);

  const queue: string[] = [firstPerson.id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentLevel = levels.get(currentId)!;

    relationships.forEach((rel) => {
      let relatedId: string | null = null;
      let levelOffset = 0;

      if (rel.fromPersonId === currentId) {
        relatedId = rel.toPersonId;
        if (rel.type === 'child') {
          levelOffset = 1;
        } else if (rel.type === 'parent') {
          levelOffset = -1;
        } else if (rel.type === 'spouse' || rel.type === 'sibling') {
          levelOffset = 0;
        }
      } else if (rel.toPersonId === currentId) {
        relatedId = rel.fromPersonId;
        if (rel.type === 'child') {
          levelOffset = -1;
        } else if (rel.type === 'parent') {
          levelOffset = 1;
        } else if (rel.type === 'spouse' || rel.type === 'sibling') {
          levelOffset = 0;
        }
      }

      if (relatedId && !visited.has(relatedId)) {
        levels.set(relatedId, currentLevel + levelOffset);
        visited.add(relatedId);
        queue.push(relatedId);
      }
    });
  }

  persons.forEach((p) => {
    if (!visited.has(p.id)) {
      levels.set(p.id, 0);
    }
  });

  return levels;
}

export function getNextPositionInLevel(
  persons: Person[],
  relationships: Relationship[],
  targetLevel: number
): { x: number; y: number } {
  const levels = calculateLevels(persons, relationships);

  const personsAtLevel = persons.filter((p) => levels.get(p.id) === targetLevel);

  if (personsAtLevel.length === 0) {
    const allY = persons.map((p) => p.position.y);
    const avgY = allY.length > 0 ? allY.reduce((a, b) => a + b, 0) / allY.length : 100;
    return { x: 100, y: avgY + targetLevel * LEVEL_HEIGHT };
  }

  const rightmostPerson = personsAtLevel.reduce((max, p) =>
    p.position.x > max.position.x ? p : max
  );

  return {
    x: rightmostPerson.position.x + PERSON_WIDTH,
    y: rightmostPerson.position.y,
  };
}

export function getYForLevel(baseY: number, baseLevel: number, targetLevel: number): number {
  return baseY + (targetLevel - baseLevel) * LEVEL_HEIGHT;
}

export function autoLayoutPositions(
  persons: Person[],
  relationships: Relationship[]
): Map<string, { x: number; y: number }> {
  return calculateTreeLayout(persons, relationships);
}

export function calculateNewPersonPosition(
  relatedPerson: Person,
  relationshipType: string,
  persons: Person[],
  relationships: Relationship[]
): { x: number; y: number } {
  const LEVEL_HEIGHT = 180;
  const PERSON_WIDTH = 150;

  let offsetX = PERSON_WIDTH;
  let offsetY = 0;

  if (relationshipType === 'child') {
    offsetY = LEVEL_HEIGHT;
    offsetX = 0;
  } else if (relationshipType === 'parent') {
    offsetY = -LEVEL_HEIGHT;
    offsetX = 0;
  } else if (relationshipType === 'spouse') {
    offsetY = 0;
    offsetX = PERSON_WIDTH;
  } else if (relationshipType === 'sibling') {
    offsetY = 0;
    offsetX = PERSON_WIDTH;
  }

  return {
    x: relatedPerson.position.x + offsetX,
    y: relatedPerson.position.y + offsetY,
  };
}

export { getTreeConnectors, NODE_WIDTH, NODE_HEIGHT };
