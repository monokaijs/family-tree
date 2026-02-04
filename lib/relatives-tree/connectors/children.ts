import { getParentsX, withType } from '../utils/family';
import { getUnitX, nodeCount, nodeIds } from '../utils/units';
import { inAscOrder, max, min, withId, withIds } from '../utils';
import { HALF_SIZE, NODES_IN_COUPLE, SIZE } from '../constants';
import { Connector, Family, FamilyType, Node, Unit } from '../types';

const getChildParentX = (family: Family, parent: Unit | undefined, node: Node): number => {
  if (!parent || parent.nodes.length < 2) {
    return getParentsX(family, parent);
  }

  const [firstParent, secondParent] = parent.nodes;
  const parentIds = parent.nodes.map(n => n.id);
  const nodeParentIds = node.parents.map(p => p.id);

  const hasFirst = nodeParentIds.includes(firstParent!.id);
  const hasSecond = nodeParentIds.includes(secondParent!.id);

  if (hasFirst && hasSecond) {
    return getParentsX(family, parent);
  } else if (hasFirst) {
    return getUnitX(family, parent) + HALF_SIZE;
  } else if (hasSecond) {
    return getUnitX(family, parent) + SIZE + HALF_SIZE;
  }

  return getParentsX(family, parent);
};

export const children = (families: readonly Family[]): readonly Connector[] =>
  families
    .filter(withType(FamilyType.root, FamilyType.child))
    .reduce<Connector[]>((connectors, family) => {
      const parent: Unit | undefined = family.parents[0]!;
      const pX = getParentsX(family, parent);
      const mY = family.Y + (parent ? SIZE : 0);

      const parentIds = family.parents.map(nodeIds).flat();

      const sharedPositions: number[] = [];
      const leftOnlyPositions: number[] = [];
      const rightOnlyPositions: number[] = [];

      family.children.forEach((unit) => {
        const left = getUnitX(family, unit) + HALF_SIZE;

        unit.nodes.forEach((node, index) => {
          if (node.parents.some(withIds(parentIds))) {
            const nX = left + index * SIZE;
            const nodeParentIds = node.parents.map(p => p.id);

            if (parent && parent.nodes.length >= 2) {
              const [firstParent, secondParent] = parent.nodes;
              const hasFirst = nodeParentIds.includes(firstParent!.id);
              const hasSecond = nodeParentIds.includes(secondParent!.id);

              if (hasFirst && hasSecond) {
                sharedPositions.push(nX);
              } else if (hasFirst) {
                leftOnlyPositions.push(nX);
              } else if (hasSecond) {
                rightOnlyPositions.push(nX);
              }
            } else {
              sharedPositions.push(nX);
            }

            connectors.push([nX, mY, nX, mY + HALF_SIZE]);
          }
        });

        if (nodeCount(unit) === NODES_IN_COUPLE) {
          connectors.push([left, mY + HALF_SIZE, left + SIZE, mY + HALF_SIZE]);
        } else if (nodeCount(unit) === 1 && unit.nodes[0]!.spouses.length) {
          family.children.forEach((nUnit) => {
            if (nUnit.nodes.some(withId(unit.nodes[0]!.spouses[0]!.id))) {
              const xX = [left, getUnitX(family, nUnit) + HALF_SIZE].sort(inAscOrder);
              connectors.push([xX[0]!, mY + HALF_SIZE, xX[1]!, mY + HALF_SIZE]);
            }
          });
        }
      });

      const leftParentX = parent ? getUnitX(family, parent) + HALF_SIZE : pX;
      const rightParentX = parent && parent.nodes.length >= 2 ? getUnitX(family, parent) + SIZE + HALF_SIZE : pX;

      if (parent && parent.nodes.every((node) => !!node.children.length)) {
        const pY = family.Y + HALF_SIZE;

        if (sharedPositions.length > 0) {
          connectors.push([pX, pY, pX, mY]);
        }
        if (leftOnlyPositions.length > 0) {
          connectors.push([leftParentX, pY, leftParentX, mY]);
        }
        if (rightOnlyPositions.length > 0) {
          connectors.push([rightParentX, pY, rightParentX, mY]);
        }
      }

      const allPositions = [...sharedPositions, ...leftOnlyPositions, ...rightOnlyPositions];

      if (sharedPositions.length > 0) {
        const minShared = min(sharedPositions);
        const maxShared = max(sharedPositions);
        if (minShared !== maxShared) {
          connectors.push([minShared, mY, maxShared, mY]);
        }
        if (pX !== minShared) {
          connectors.push([Math.min(pX, minShared), mY, Math.max(pX, maxShared), mY]);
        }
      }

      if (leftOnlyPositions.length > 0) {
        const minLeft = min(leftOnlyPositions);
        const maxLeft = max(leftOnlyPositions);
        if (minLeft !== maxLeft) {
          connectors.push([minLeft, mY, maxLeft, mY]);
        }
        if (leftParentX !== minLeft || leftParentX !== maxLeft) {
          connectors.push([Math.min(leftParentX, minLeft), mY, Math.max(leftParentX, maxLeft), mY]);
        }
      }

      if (rightOnlyPositions.length > 0) {
        const minRight = min(rightOnlyPositions);
        const maxRight = max(rightOnlyPositions);
        if (minRight !== maxRight) {
          connectors.push([minRight, mY, maxRight, mY]);
        }
        if (rightParentX !== minRight || rightParentX !== maxRight) {
          connectors.push([Math.min(rightParentX, minRight), mY, Math.max(rightParentX, maxRight), mY]);
        }
      }

      return connectors;
    }, []);
