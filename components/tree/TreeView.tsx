import React, { useRef, useCallback, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  Person,
  setSelectedPerson,
  setViewTransform,
  updateAllPositions,
  Relationship,
} from '@/store/slices/familyTreeSlice';
import TreeCanvas from './TreeCanvas';
import TreeControls from './TreeControls';
import { AppText } from '@/components/ui';
import { TreeDeciduous, Users } from 'lucide-react-native';
import { autoLayoutPositions } from '@/utils/familyTreeLayout';

const CANVAS_SIZE = 4000;



export default function TreeView() {
  const colors = useColors();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { persons, relationships, viewTransform, selectedPersonId } = useAppSelector(
    (state) => state.familyTree
  );
  const initializedRef = useRef(false);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (persons.length === 0) {
      dispatch(
        setViewTransform({
          scale: 1,
          translateX: screenWidth / 2 - CANVAS_SIZE / 2,
          translateY: screenHeight / 2 - CANVAS_SIZE / 2,
        })
      );
    } else if (!initializedRef.current) {
      initializedRef.current = true;
      const layoutPositions = autoLayoutPositions(persons, relationships);
      let avgX = 0;
      let avgY = 0;
      layoutPositions.forEach((pos) => {
        avgX += pos.x;
        avgY += pos.y;
      });
      avgX /= layoutPositions.size || 1;
      avgY /= layoutPositions.size || 1;
      dispatch(
        setViewTransform({
          scale: 1,
          translateX: screenWidth / 2 - avgX,
          translateY: screenHeight / 2 - avgY,
        })
      );
    }
  }, [persons.length]);

  const centerOnPosition = useCallback((x: number, y: number) => {
    dispatch(
      setViewTransform({
        scale: viewTransform.scale || 1,
        translateX: screenWidth / 2 - x,
        translateY: screenHeight / 2 - y,
      })
    );
  }, [dispatch, screenWidth, screenHeight, viewTransform.scale]);

  const handleCanvasTap = useCallback(() => {
    dispatch(setSelectedPerson(null));
  }, [dispatch]);

  const handlePersonPress = useCallback((person: Person) => {
    dispatch(setSelectedPerson(person.id));
    router.push({
      pathname: '/person-detail',
      params: { personId: person.id },
    });
  }, [dispatch, router]);

  const handlePersonLongPress = useCallback((person: Person) => {
    router.push({
      pathname: '/person-form',
      params: { mode: 'edit', personId: person.id },
    });
  }, [router]);

  const handleAddPerson = useCallback(() => {
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;

    if (persons.length === 0) {
      router.push({
        pathname: '/person-form',
        params: { mode: 'create', positionX: centerX.toString(), positionY: centerY.toString() },
      });
    } else {
      const lastPerson = persons[persons.length - 1];
      const newX = lastPerson.position.x + 180;
      const newY = lastPerson.position.y;
      router.push({
        pathname: '/person-form',
        params: { mode: 'create', positionX: newX.toString(), positionY: newY.toString() },
      });
    }
  }, [persons, router]);

  const handleZoomIn = useCallback(() => {
    const { scale, translateX, translateY } = viewTransform;
    const newScale = Math.min(3, scale * 1.3);
    const ratio = newScale / scale;

    const newTranslateX = (screenWidth / 2) - ((screenWidth / 2) - translateX) * ratio;
    const newTranslateY = (screenHeight / 2) - ((screenHeight / 2) - translateY) * ratio;

    dispatch(setViewTransform({
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY
    }));
  }, [dispatch, viewTransform, screenWidth, screenHeight]);

  const handleZoomOut = useCallback(() => {
    const { scale, translateX, translateY } = viewTransform;
    const newScale = Math.max(0.3, scale / 1.3);
    const ratio = newScale / scale;

    const newTranslateX = (screenWidth / 2) - ((screenWidth / 2) - translateX) * ratio;
    const newTranslateY = (screenHeight / 2) - ((screenHeight / 2) - translateY) * ratio;

    dispatch(setViewTransform({
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY
    }));
  }, [dispatch, viewTransform, screenWidth, screenHeight]);

  const handleCenter = useCallback(() => {
    if (persons.length === 0) {
      dispatch(
        setViewTransform({
          scale: 1,
          translateX: screenWidth / 2 - CANVAS_SIZE / 2,
          translateY: screenHeight / 2 - CANVAS_SIZE / 2,
        })
      );
    } else {
      const avgX = persons.reduce((sum, p) => sum + p.position.x, 0) / persons.length;
      const avgY = persons.reduce((sum, p) => sum + p.position.y, 0) / persons.length;
      dispatch(
        setViewTransform({
          ...viewTransform,
          translateX: screenWidth / 2 - avgX * viewTransform.scale,
          translateY: screenHeight / 2 - avgY * viewTransform.scale,
        })
      );
    }
  }, [dispatch, persons, screenWidth, screenHeight, viewTransform]);

  const handleReset = useCallback(() => {
    dispatch(
      setViewTransform({
        scale: 1,
        translateX: screenWidth / 2 - CANVAS_SIZE / 2,
        translateY: screenHeight / 2 - CANVAS_SIZE / 2,
      })
    );
    dispatch(setSelectedPerson(null));
  }, [dispatch, screenWidth, screenHeight]);

  const handleAutoLayout = useCallback(() => {
    if (persons.length === 0) return;

    const newPositions = autoLayoutPositions(persons, relationships);
    dispatch(updateAllPositions(Object.fromEntries(newPositions)));

    setTimeout(() => {
      const positions = Array.from(newPositions.values());
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
      dispatch(
        setViewTransform({
          scale: 1,
          translateX: screenWidth / 2 - avgX,
          translateY: screenHeight / 2 - avgY,
        })
      );
    }, 50);
  }, [dispatch, persons, relationships, screenWidth, screenHeight]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Pass sample data to TreeCanvas */}
      <TreeCanvas
        onPersonPress={handlePersonPress}
        onPersonLongPress={handlePersonLongPress}
        onCanvasTap={handleCanvasTap}
        persons={persons}
        relationships={relationships}
        connectorColor={colors.neutrals700}
      />

      <View className="absolute top-0 left-0 pt-safe-offset-12 pl-4">
        <View className="flex-row items-center gap-2.5">
          <AppText className="text-2xl font-bold" style={{ color: colors.foreground }}>
            Family Tree
          </AppText>
        </View>
        <View className="mt-2.5 flex-row gap-2.5">
          <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-neutrals700">
            <Users size={14} color={colors.neutrals300} />
            <AppText className="text-sm font-semibold" style={{ color: colors.neutrals300 }}>
              {persons.length}
            </AppText>
          </View>
        </View>
      </View>

      {persons.length === 0 && (
        <View className="pointer-events-none absolute inset-0 items-center justify-center">
          <View className="max-w-[280px] items-center rounded-3xl p-8" style={{ backgroundColor: colors.neutrals800 + 'E0' }}>
            <TreeDeciduous size={48} color={colors.neutrals500} />
            <AppText className="mt-4 text-center text-xl font-bold" style={{ color: colors.foreground }}>
              Start Your Family Tree
            </AppText>
            <AppText className="mt-2 text-center text-sm leading-5" style={{ color: colors.neutrals400 }}>
              Tap the + button to add your first family member
            </AppText>
          </View>
        </View>
      )}

      <TreeControls
        scale={viewTransform.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={handleCenter}
        onReset={handleReset}
        onAddPerson={handleAddPerson}
        onAutoLayout={handleAutoLayout}
      />
    </View>
  );
}
