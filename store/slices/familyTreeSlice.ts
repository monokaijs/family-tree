import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Gender = 'male' | 'female' | 'other';

export type RelationshipType =
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling';

export interface Person {
  id: string;
  givenName: string;
  gender: Gender;
  bio?: string;
  photos: string[];
  avatarUrl?: string;
  birthday?: string;
  dateOfDeath?: string;
  phoneNumber?: string;
  address?: string;
  workplace?: string;
  position: {
    x: number;
    y: number;
  };
}

export interface Relationship {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
}

interface FamilyTreeState {
  persons: Person[];
  relationships: Relationship[];
  selectedPersonId: string | null;
  viewTransform: {
    scale: number;
    translateX: number;
    translateY: number;
  };
}

const initialState: FamilyTreeState = {
  persons: [],
  relationships: [],
  selectedPersonId: null,
  viewTransform: {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
};

const familyTreeSlice = createSlice({
  name: 'familyTree',
  initialState,
  reducers: {
    addPerson: (state, action: PayloadAction<Omit<Person, 'id'>>) => {
      const id = `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      state.persons.push({ ...action.payload, id });
    },
    updatePerson: (state, action: PayloadAction<Person>) => {
      const index = state.persons.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.persons[index] = action.payload;
      }
    },
    removePerson: (state, action: PayloadAction<string>) => {
      state.persons = state.persons.filter(p => p.id !== action.payload);
      state.relationships = state.relationships.filter(
        r => r.fromPersonId !== action.payload && r.toPersonId !== action.payload
      );
      if (state.selectedPersonId === action.payload) {
        state.selectedPersonId = null;
      }
    },
    updatePersonPosition: (state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) => {
      const person = state.persons.find(p => p.id === action.payload.id);
      if (person) {
        person.position = action.payload.position;
      }
    },
    addRelationship: (state, action: PayloadAction<Omit<Relationship, 'id'>>) => {
      const existingRelation = state.relationships.find(
        r =>
          (r.fromPersonId === action.payload.fromPersonId && r.toPersonId === action.payload.toPersonId) ||
          (r.fromPersonId === action.payload.toPersonId && r.toPersonId === action.payload.fromPersonId && r.type === action.payload.type)
      );
      if (!existingRelation) {
        const id = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        state.relationships.push({ ...action.payload, id });
      }
    },
    removeRelationship: (state, action: PayloadAction<string>) => {
      state.relationships = state.relationships.filter(r => r.id !== action.payload);
    },
    setSelectedPerson: (state, action: PayloadAction<string | null>) => {
      state.selectedPersonId = action.payload;
    },
    setViewTransform: (state, action: PayloadAction<{ scale: number; translateX: number; translateY: number }>) => {
      state.viewTransform = action.payload;
    },
    addPersonWithRelationship: (
      state,
      action: PayloadAction<{
        person: Omit<Person, 'id'>;
        relatedToPersonId: string;
        relationshipType: RelationshipType;
      }>
    ) => {
      const personId = `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      state.persons.push({ ...action.payload.person, id: personId });

      const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      state.relationships.push({
        id: relationshipId,
        fromPersonId: action.payload.relatedToPersonId,
        toPersonId: personId,
        type: action.payload.relationshipType,
      });
    },
    updateAllPositions: (state, action: PayloadAction<Map<string, { x: number; y: number }> | Record<string, { x: number; y: number }>>) => {
      const positions = action.payload instanceof Map
        ? Object.fromEntries(action.payload)
        : action.payload;
      state.persons.forEach(person => {
        const newPos = positions[person.id];
        if (newPos) {
          person.position = newPos;
        }
      });
    },
    resetTree: (state) => {
      state.persons = [];
      state.relationships = [];
      state.selectedPersonId = null;
      state.viewTransform = { scale: 1, translateX: 0, translateY: 0 };
    },
  },
});

export const {
  addPerson,
  updatePerson,
  removePerson,
  updatePersonPosition,
  addRelationship,
  removeRelationship,
  setSelectedPerson,
  setViewTransform,
  addPersonWithRelationship,
  updateAllPositions,
  resetTree,
} = familyTreeSlice.actions;

export default familyTreeSlice.reducer;
