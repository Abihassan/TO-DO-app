import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

const CONFETTI_COLORS = ["#FFC93C", "#FF6B6B", "#7C3AED", "#14B8A6", "#EC4899", "#22C55E"];
const PIECE_COUNT = 10;

function ConfettiPiece({ index, active }) {
  const progress = useRef(new Animated.Value(0)).current;
  const angle = (index / PIECE_COUNT) * Math.PI * 2;
  const distance = 34 + (index % 3) * 8;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  useEffect(() => {
    if (active) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [active]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * distance],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * distance - 10],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 0.4],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 7,
        height: 7,
        borderRadius: index % 2 === 0 ? 4 : 1,
        backgroundColor: color,
        left: "50%",
        top: "50%",
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

export default function ConfettiBurst({ burstKey }) {
  const active = burstKey > 0;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
    >
      {Array.from({ length: PIECE_COUNT }).map((_, i) => (
        <ConfettiPiece key={`${burstKey}-${i}`} index={i} active={active} />
      ))}
    </View>
  );
}
