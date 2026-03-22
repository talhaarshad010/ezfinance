import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {colors} from '../theme/colors';

interface PaginationDotsProps {
  total: number;
  activeIndex: number;
  containerStyle?: ViewStyle;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({
  total,
  activeIndex,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({length: total}).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#D1D1D1',
  },
});

export default PaginationDots;
