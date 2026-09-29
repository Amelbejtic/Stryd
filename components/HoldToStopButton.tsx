// Jeg importerer det jeg skal bruge til UI og animation
import { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';

// Hvor lang tid (i ms) brugeren skal holde knappen nede
const HOLD_DURATION = 1200;

interface HoldToStopButtonProps {
  onComplete: () => void; // Kaldes når holdet er gennemført
}

export function HoldToStopButton({ onComplete }: HoldToStopButtonProps) {
  // progress går fra 0 til 1 over HOLD_DURATION ms — bruges til at style fyld-baren
  const progress = useRef(new Animated.Value(0)).current;

  // Reference til selve animationen, så vi kan stoppe den hvis brugeren slipper tidligt
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Når fingeren trykkes ned: start animationen mod 1
  const handlePressIn = () => {
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false, // false fordi vi animerer 'width', som ikke supporteres af native driver
    });

    // start() tager en callback der kører når animationen er færdig
    // finished er true kun hvis den nåede helt til 1 (ikke afbrudt)
    animationRef.current.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  };

  // Når fingeren slippes: stop animationen og nulstil til 0
  const handlePressOut = () => {
    animationRef.current?.stop();
    progress.setValue(0);
  };

  // progress (0-1) konverteres til en procent-bredde for fyld-baren
  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.button}>
      {/* Fyld-baren der animerer fra venstre til højre */}
      <Animated.View style={[styles.fill, { width: fillWidth }]} />
      <Text style={styles.text}>Hold to stop</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F44336',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 50,
    overflow: 'hidden', // sørger for at fyld-baren ikke går udenfor de runde hjørner
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#8B0000', // mørkere rød, fylder op bagved teksten
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});