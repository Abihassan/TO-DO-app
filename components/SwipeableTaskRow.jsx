import React, { useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function SwipeableTaskRow({ children, onEdit, onDelete }) {
  const swipeableRef = useRef(null);

  const renderLeftActions = (progress) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: "clamp",
    });
    return (
      <View style={[styles.actionWrap, { backgroundColor: "#FFC93C" }]}>
        <Animated.Text style={[styles.actionEmoji, { transform: [{ scale }] }]}>
          ✏️
        </Animated.Text>
        <Text style={styles.actionLabel}>Edit</Text>
      </View>
    );
  };

  const renderRightActions = (progress) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: "clamp",
    });
    return (
      <View style={[styles.actionWrap, { backgroundColor: "#FF6B6B" }]}>
        <Animated.Text style={[styles.actionEmoji, { transform: [{ scale }] }]}>
          🗑️
        </Animated.Text>
        <Text style={styles.actionLabel}>Delete</Text>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={70}
      rightThreshold={70}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          onEdit();
        } else {
          onDelete();
        }
        swipeableRef.current?.close();
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 84,
    borderRadius: 24,
    marginVertical: 6,
  },
  actionEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
