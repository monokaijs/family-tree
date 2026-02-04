import { Person, Relationship } from '@/store/slices/familyTreeSlice';
import calcTree from 'relatives-tree';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 180;

const AVATAR_SIZE = 72;
const VISUAL_NODE_HEIGHT = 120;
const CONNECTOR_Y_OFFSET = -(VISUAL_NODE_HEIGHT / 2) + (AVATAR_SIZE / 2);

// Scaling factors: relatives-tree uses a coordinate system where
// the fundamental unit is typically half the node width/height.
const CANVAS_HALF_WIDTH = 1500; // Offset to start drawing
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

/**
 * Convert app types to relatives-tree expects structure
 */
function convertToRelativesTreeNodes(
  persons: Person[],
  relationships: Relationship[]
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  // 1. Initialize all nodes
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

  // 2. Populate relationships
  relationships.forEach((rel) => {
    const from = nodeMap.get(rel.fromPersonId);
    const to = nodeMap.get(rel.toPersonId);
    if (!from || !to) return;

    switch (rel.type) {
      case 'spouse':
        // Add to both sides
        if (!from.spouses.some(r => r.id === to.id)) from.spouses.push({ id: to.id, type: 'married' });
        if (!to.spouses.some(r => r.id === from.id)) to.spouses.push({ id: from.id, type: 'married' });
        break;

      case 'child':
        // 'child' means: FROM is parent, TO is child (based on usage in previous steps)
        // Let's assume standard direction: Person A (from) has child Person B (to)
        if (!from.children.some(r => r.id === to.id)) from.children.push({ id: to.id, type: 'blood' });
        if (!to.parents.some(r => r.id === from.id)) to.parents.push({ id: from.id, type: 'blood' });
        break;

      case 'parent':
        // 'parent' means: FROM is child, TO is parent
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
  // Candidate roots: check ALL nodes to find the optimal root for hourglass graphs
  const candidates = nodes;
  if (candidates.length === 0) return nodes[0]?.id || '';
  // if (candidates.length === 1) return candidates[0].id; // Don't optimize single candidate early if we assume candidates=nodes

  // Heuristic: Run calcTree on all candidates and pick the one with max nodes
  // This is expensive but necessary to guarantee we show the "Main" tree.
  // Optimization: limit to top 10 candidates if needed, but for <500 nodes it's fine.

  let bestRoot = candidates[0].id;
  let maxCount = -1;

  for (const cand of candidates) {
    try {
      const tree = calcTree(nodes as any, { rootId: cand.id });
      if (tree.nodes.length > maxCount) {
        maxCount = tree.nodes.length;
        bestRoot = cand.id;
      }
      // If we cover everyone, stop early
      if (maxCount === nodes.length) break;
    } catch (e) {
      continue;
    }
  }

  return bestRoot;
}

// Cache last calculation to avoid re-running expensive graph logic twice
let layoutCache: {
  key: string;
  nodes: ExtNode[];
  connectors: Connector[];
} | null = null;

function getCalculatedData(persons: Person[], relationships: Relationship[]) {
  const key = `${persons.length}-${relationships.length}`;
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

// Scaling: Based on React Web implementation where width/height are halved.
// The library seems to output grid units where 1 unit = Half Node Dimension.
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

  // Handle unconnected nodes
  // const calculatedIds = new Set(nodes.map(n => n.id));
  // let orphanOffset = 0;
  //
  // let maxX = 0;
  // nodes.forEach(n => { maxX = Math.max(maxX, n.left * X_FACTOR); });
  //
  // persons.forEach(p => {
  //   if (!calculatedIds.has(p.id)) {
  //     positions.set(p.id, {
  //       x: maxX + (NODE_WIDTH * 2) + orphanOffset + CANVAS_HALF_WIDTH,
  //       y: CANVAS_HALF_HEIGHT
  //     });
  //     orphanOffset += NODE_WIDTH * 1.5;
  //   }
  // });

  return positions;
}

export function getTreeConnectors(
  persons: Person[],
  relationships: Relationship[]
): Connector[] {
  const { connectors } = getCalculatedData(persons, relationships);

  // Return raw points scaled by half-dimensions
  // The React example suggests the output [x1, y1, x2, y2] are in grid units.
  return connectors.map(c => [
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
