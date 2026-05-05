--- components/CountdownAnimation.tsx (原始)


+++ components/CountdownAnimation.tsx (修改后)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * Componente de animação para contagem regressiva do botão SOS
 * Mostra uma contagem de 3 segundos enquanto o usuário segura o botão
 */

interface CountdownAnimationProps {
  isActive: boolean;
  onComplete: () => void;
}

export const CountdownAnimation: React.FC<CountdownAnimationProps> = ({
  isActive,
  onComplete,
}) => {
  const [count, setCount] = useState(3);
  const scaleValue = new Animated.Value(1);
  const opacityValue = new Animated.Value(1);

  useEffect(() => {
    if (!isActive) {
      setCount(3);
      return;
    }

    // Resetar animações
    scaleValue.setValue(1);
    opacityValue.setValue(1);

    // Animar pulso
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    // Contagem regressiva
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          pulseAnimation.stop();

          // Animar conclusão
          Animated.sequence([
            Animated.timing(opacityValue, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onComplete();
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulseAnimation.stop();
    };
  }, [isActive, onComplete]);

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      >
        <Text style={styles.count}>{count > 0 ? count : ''}</Text>
      </Animated.View>
      <Text style={styles.text}>Segure para gravar...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  text: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    fontWeight: '600',
  },
});
