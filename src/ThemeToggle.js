import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, colors, toggleTheme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(isDark ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const styles = createStyles(colors);

  const rotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity 
      style={styles.toggle}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Animated.Text 
        style={[styles.icon, { transform: [{ rotate: rotation }] }]}
      >
        {isDark ? '🌙' : '☀️'}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors) => StyleSheet.create({
  toggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    bottom:0
  },
  icon: {
    fontSize: 20,
  },
});

export default ThemeToggle;