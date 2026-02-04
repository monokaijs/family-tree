import type Store from '../store';
import { byGender, relToNode, withId } from '../utils';
import { newUnit } from '../utils/units';
import { newFamily } from '../utils/family';
import { setDefaultUnitShift } from '../utils/setDefaultUnitShift';
import { createChildUnitsFunc } from '../utils/createChildUnitsFunc';
import { Family, FamilyType, Node, Relation, Unit } from '../types';

const getChildUnitsFunc = (store: Store) => {
  const toNode = relToNode(store);
  const createChildUnits = createChildUnitsFunc(store);

  return (familyId: number, parents: readonly Node[]): readonly Unit[] => {
    const [first, second] = parents as [Node, Node | undefined];

    const allChildIds = new Set<string>();
    first.children.forEach(rel => allChildIds.add(rel.id));
    if (second) {
      second.children.forEach(rel => allChildIds.add(rel.id));
    }

    return Array.from(allChildIds)
      .map(id => first.children.find(withId(id)) || second?.children.find(withId(id)))
      .filter((rel): rel is Relation => Boolean(rel))
      .flatMap((rel) => createChildUnits(familyId, toNode(rel)));
  };
};

export const createFamilyFunc = (store: Store) => {
  const getChildUnits = getChildUnitsFunc(store);

  return (
    parentIDs: readonly string[],
    type = FamilyType.root,
    isMain: boolean = false,
  ): Family => {
    const family = newFamily(store.getNextId(), type, isMain);

    const parents: Node[] = parentIDs
      .map((id) => store.getNode(id))
      .sort(byGender(store.root.gender));

    family.parents = [newUnit(family.id, parents)];
    family.children = getChildUnits(family.id, parents);

    setDefaultUnitShift(family);
    return family;
  };
};
