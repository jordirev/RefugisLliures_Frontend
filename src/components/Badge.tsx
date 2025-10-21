import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  text: string;
  background?: string;
  color?: string;
  borderColor?: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  background = '#A2FFC8',
  color = '#007931',
  borderColor = '#30D270',
  containerStyle,
  textStyle,
}) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: background, borderColor: borderColor, borderWidth: 1.25 },
        containerStyle,
      ]}
    >
      <Text style={[styles.text, { color }, textStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 16,
  },
});
