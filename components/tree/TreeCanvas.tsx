import React, { useMemo, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  setSelectedPerson,
  setViewTransform,
  Person,
  Relationship,
} from '@/store/slices/familyTreeSlice';
import PersonNode from './PersonNode';
import { calculateTreeLayout, getTreeConnectors } from '@/utils/treeLayout';

export interface FamilyTreeProps {
  // Data
  persons?: Person[];
  relationships?: Relationship[];

  // Customization
  renderNode?: (props: {
    person: Person;
    isSelected: boolean;
    onPress: () => void;
    onLongPress: () => void;
  }) => React.ReactNode;

  connectorColor?: string;
  connectorWidth?: number;
  showGrid?: boolean;

  // Events
  onPersonPress?: (person: Person) => void;
  onPersonLongPress?: (person: Person) => void;
  onCanvasTap?: (x: number, y: number) => void;
}

const CANVAS_SIZE = 4000;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

/**
 * A comprehensive, interactive Family Tree visualization component.
 * Handles layout calculation, zooming, panning, and rendering of nodes and connectors.
 */
export default function FamilyTree({
  persons: propsPersons,
  relationships: propsRelationships,
  renderNode,
  connectorColor = '#D1D5DB',
  connectorWidth = 1.5,
  showGrid = true,
  onPersonPress,
  onPersonLongPress,
  onCanvasTap,
}: FamilyTreeProps) {
  const colors = useColors();
  const dispatch = useAppDispatch();

  const {
    persons: storePersons,
    relationships: storeRelationships,
    selectedPersonId,
    viewTransform
  } = useAppSelector(
    (state) => state.familyTree
  );

  // Use props if provided, otherwise fallback to store
  const persons = propsPersons || storePersons;
  const relationships = propsRelationships || storeRelationships;

  // Animation State
  const scale = useSharedValue(viewTransform.scale);
  const translateX = useSharedValue(viewTransform.translateX);
  const translateY = useSharedValue(viewTransform.translateY);

  const savedScale = useSharedValue(viewTransform.scale);
  const savedTranslateX = useSharedValue(viewTransform.translateX);
  const savedTranslateY = useSharedValue(viewTransform.translateY);

  const startFocalX = useSharedValue(0);
  const startFocalY = useSharedValue(0);

  // Sync with Store
  useEffect(() => {
    scale.value = withTiming(viewTransform.scale, { duration: 150 });
    translateX.value = withTiming(viewTransform.translateX, { duration: 150 });
    translateY.value = withTiming(viewTransform.translateY, { duration: 150 });
    savedScale.value = viewTransform.scale;
    savedTranslateX.value = viewTransform.translateX;
    savedTranslateY.value = viewTransform.translateY;
  }, [viewTransform.scale, viewTransform.translateX, viewTransform.translateY]);

  // Layout Calculation
  const layoutPositions = useMemo(() => {
    return calculateTreeLayout(persons, relationships);
  }, [persons, relationships]);

  const layoutPersons = useMemo(() => {
    return persons.map(p => {
      const newPos = layoutPositions.get(p.id);
      if (newPos) {
        return { ...p, position: newPos };
      }
      return p;
    });
  }, [persons, layoutPositions]);

  const connectors = useMemo(() => {
    return getTreeConnectors(persons, relationships);
  }, [persons, relationships]);

  const updateTransform = () => {
    dispatch(
      setViewTransform({
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      })
    );
  };

  // Gestures
  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      startFocalX.value = e.focalX;
      startFocalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, savedScale.value * e.scale));
      scale.value = newScale;

      const distinctScaleRatio = newScale / savedScale.value;

      translateX.value = e.focalX - (startFocalX.value - savedTranslateX.value) * distinctScaleRatio;
      translateY.value = e.focalY - (startFocalY.value - savedTranslateY.value) * distinctScaleRatio;
    })
    .onEnd(() => {
      runOnJS(updateTransform)();
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(updateTransform)();
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      if (onCanvasTap) {
        const canvasX = (e.x - translateX.value) / scale.value;
        const canvasY = (e.y - translateY.value) / scale.value;
        runOnJS(onCanvasTap)(canvasX, canvasY);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(panGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    transformOrigin: ['0%', '0%', 0],
  }));

  const handlePersonPress = (person: Person) => {
    dispatch(setSelectedPerson(person.id));
    onPersonPress?.(person);
  };

  const handlePersonLongPress = (person: Person) => {
    dispatch(setSelectedPerson(person.id));
    onPersonLongPress?.(person);
  };

  return (
    <View className="flex-1 overflow-hidden" style={{ backgroundColor: colors.background }}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View className="flex-1 w-full h-full">
          <Animated.View
            className="absolute"
            style={[{ width: CANVAS_SIZE, height: CANVAS_SIZE }, animatedStyle]}
          >
            {/* Grid Background */}
            {showGrid && (
              <View
                className="absolute left-0 top-0 pointer-events-none"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              >
                {Array.from({ length: 40 }).map((_, i) => (
                  <View
                    key={`h-${i}`}
                    className="absolute h-px w-full opacity-30"
                    style={{
                      top: i * 100,
                      backgroundColor: colors.neutrals800,
                    }}
                  />
                ))}
                {Array.from({ length: 40 }).map((_, i) => (
                  <View
                    key={`v-${i}`}
                    className="absolute h-full w-px opacity-30"
                    style={{
                      left: i * 100,
                      backgroundColor: colors.neutrals800,
                    }}
                  />
                ))}
              </View>
            )}

            {/* Connectors Layer */}
            <Svg
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {connectors.map((connector, idx) => (
                <Line
                  key={idx}
                  x1={connector[0]}
                  y1={connector[1]}
                  x2={connector[2]}
                  y2={connector[3]}
                  stroke={connectorColor}
                  strokeWidth={connectorWidth}
                />
              ))}
            </Svg>

            {/* Nodes Layer */}
            {layoutPersons.map((person) => {
              // If custom render function is provided:
              if (renderNode) {
                return (
                  <View key={person.id} style={{ position: 'absolute' }}>
                    {renderNode({
                      person,
                      isSelected: selectedPersonId === person.id,
                      onPress: () => handlePersonPress(person),
                      onLongPress: () => handlePersonLongPress(person),
                    })}
                  </View>
                );
              }

              // Default Render
              return (
                <PersonNode
                  key={person.id}
                  person={person}
                  isSelected={selectedPersonId === person.id}
                  onPress={() => handlePersonPress(person)}
                  onLongPress={() => handlePersonLongPress(person)}
                />
              );
            })}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

