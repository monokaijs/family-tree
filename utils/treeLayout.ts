import { Person, Relationship } from '@/store/slices/familyTreeSlice';
import calcTree from '@/lib/relatives-tree';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 180;

const AVATAR_SIZE = 72;
const VISUAL_NODE_HEIGHT = 120;
const CONNECTOR_Y_OFFSET = -(VISUAL_NODE_HEIGHT / 2) + (AVATAR_SIZE / 2);

const CANVAS_HALF_WIDTH = 1500;
const CANVAS_HALF_HEIGHT = 1500;

interface Relation {
  id: string;
  type: 'blood' | 'married' | 'divorced' | 'adopted' | 'half';
}

interface TreeNode {
  id: string;
  gender: 'male' | 'female';
  parents: Relation[];
  children: Relation[];
  siblings: Relation[];
  spouses: Relation[];
}

interface ExtNode {
  id: string;
  top: number;
  left: number;
}

type Connector = readonly [number, number, number, number];

function convertToRelativesTreeNodes(
  persons: Person[],
  relationships: Relationship[]
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  persons.forEach((p) => {
    nodeMap.set(p.id, {
      id: p.id,
      gender: p.gender === 'male' ? 'male' : 'female',
      parents: [],
      children: [],
      siblings: [],
      spouses: [],
    });
  });

  relationships.forEach((rel) => {
    const from = nodeMap.get(rel.fromPersonId);
    const to = nodeMap.get(rel.toPersonId);
    if (!from || !to) return;

    switch (rel.type) {
      case 'spouse':
        if (!from.spouses.some(r => r.id === to.id)) from.spouses.push({ id: to.id, type: 'married' });
        if (!to.spouses.some(r => r.id === from.id)) to.spouses.push({ id: from.id, type: 'married' });
        break;

      case 'child':
        if (!from.children.some(r => r.id === to.id)) from.children.push({ id: to.id, type: 'blood' });
        if (!to.parents.some(r => r.id === from.id)) to.parents.push({ id: from.id, type: 'blood' });
        break;

      case 'parent':
        if (!from.parents.some(r => r.id === to.id)) from.parents.push({ id: to.id, type: 'blood' });
        if (!to.children.some(r => r.id === from.id)) to.children.push({ id: from.id, type: 'blood' });
        break;

      case 'sibling':
        if (!from.siblings.some(r => r.id === to.id)) from.siblings.push({ id: to.id, type: 'blood' });
        if (!to.siblings.some(r => r.id === from.id)) to.siblings.push({ id: from.id, type: 'blood' });
        break;
    }
  });

  return Array.from(nodeMap.values());
}

function findBestRoot(nodes: TreeNode[]): string {
  const candidates = nodes;
  if (candidates.length === 0) return nodes[0]?.id || '';

  let bestRoot = candidates[0].id;
  let maxCount = -1;

  for (const cand of candidates) {
    try {
      const tree = calcTree(nodes as any, { rootId: cand.id });
      if (tree.nodes.length > maxCount) {
        maxCount = tree.nodes.length;
        bestRoot = cand.id;
      }
      if (maxCount === nodes.length) break;
    } catch (e) {
      continue;
    }
  }

  return bestRoot;
}

let layoutCache: {
  key: string;
  nodes: ExtNode[];
  connectors: Connector[];
} | null = null;

function getCalculatedData(persons: Person[], relationships: Relationship[]) {
  const personIds = persons.map(p => p.id).sort().join(',');
  const relIds = relationships.map(r => `${r.id}:${r.fromPersonId}-${r.toPersonId}:${r.type}`).sort().join('|');
  const key = `${personIds}::${relIds}`;
  if (layoutCache && layoutCache.key === key) {
    return layoutCache;
  }

  const nodes = convertToRelativesTreeNodes(persons, relationships);
  if (nodes.length === 0) return { key, nodes: [], connectors: [] };

  const rootId = findBestRoot(nodes);
  const tree = calcTree(nodes as any, { rootId });

  const result = {
    key,
    nodes: tree.nodes as unknown as ExtNode[],
    connectors: tree.connectors as Connector[],
  };

  layoutCache = result;
  return result;
}

const X_FACTOR = NODE_WIDTH / 2;
const Y_FACTOR = NODE_HEIGHT / 2;

export function calculateTreeLayout(
  persons: Person[],
  relationships: Relationship[]
): Map<string, { x: number; y: number }> {
  const { nodes } = getCalculatedData(persons, relationships);
  const positions = new Map<string, { x: number; y: number }>();

  nodes.forEach((node) => {
    positions.set(node.id, {
      x: (node.left * X_FACTOR) + X_FACTOR + CANVAS_HALF_WIDTH,
      y: (node.top * Y_FACTOR) + Y_FACTOR + CANVAS_HALF_HEIGHT,
    });
  });

  return positions;
}

export function getTreeConnectors(
  persons: Person[],
  relationships: Relationship[]
): Connector[] {
  const { connectors } = getCalculatedData(persons, relationships);

  return connectors.map(c => [
    c[0] * X_FACTOR + CANVAS_HALF_WIDTH,
    c[1] * Y_FACTOR + CANVAS_HALF_HEIGHT + CONNECTOR_Y_OFFSET,
    c[2] * X_FACTOR + CANVAS_HALF_WIDTH,
    c[3] * Y_FACTOR + CANVAS_HALF_HEIGHT + CONNECTOR_Y_OFFSET,
  ]);
}

export function calculateTreeLayoutFromRaw(nodes: TreeNode[], rootId: string): Map<string, { x: number; y: number }> {
  const tree = calcTree(nodes as any, { rootId });
  const positions = new Map<string, { x: number; y: number }>();

  tree.nodes.forEach((node: any) => {
    positions.set(node.id, {
      x: (node.left * X_FACTOR) + X_FACTOR + CANVAS_HALF_WIDTH,
      y: (node.top * Y_FACTOR) + Y_FACTOR + CANVAS_HALF_HEIGHT,
    });
  });

  return positions;
}

export function getTreeConnectorsFromRaw(nodes: TreeNode[], rootId: string): Connector[] {
  const tree = calcTree(nodes as any, { rootId });

  return tree.connectors.map((c: Connector) => [
    c[0] * X_FACTOR + CANVAS_HALF_WIDTH,
    c[1] * Y_FACTOR + CANVAS_HALF_HEIGHT + CONNECTOR_Y_OFFSET,
    c[2] * X_FACTOR + CANVAS_HALF_WIDTH,
    c[3] * Y_FACTOR + CANVAS_HALF_HEIGHT + CONNECTOR_Y_OFFSET,
  ]);
}

export function applyLayoutToPersons(
  persons: Person[],
  layout: Map<string, { x: number; y: number }>
): Person[] {
  return persons.map((p) => {
    const newPos = layout.get(p.id);
    if (newPos) {
      return { ...p, position: newPos };
    }
    return p;
  });
}

export { NODE_WIDTH, NODE_HEIGHT };
