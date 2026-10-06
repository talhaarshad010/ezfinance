import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ModalProps,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AnimatedModalProps extends ModalProps {
  /** Dim layer colour. Defaults to 50% black for sheets, 60% for dialogs. */
  backdropColor?: string;
  /** Called once the exit animation has finished and the modal is gone. */
  onDismissed?: () => void;
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

// iOS cannot present a second native modal while another one is still on
// screen. Because modals now stay mounted during their exit animation, a modal
// that opens while another is closing waits for that exit to finish first.
let closingCount = 0;
const waitingToOpen = new Set<() => void>();

function beginClosing() {
  closingCount += 1;
}

function endClosing() {
  closingCount = Math.max(0, closingCount - 1);
  if (closingCount === 0) {
    const pending = Array.from(waitingToOpen);
    waitingToOpen.clear();
    pending.forEach(open => open());
  }
}

/**
 * Drop-in replacement for React Native's `Modal` with smooth enter/exit motion.
 *
 * The native Modal animates the backdrop together with the content (a slide
 * drags the dim layer up with the sheet) and closes instantly. This keeps the
 * modal mounted until its exit animation finishes and animates the layers
 * separately:
 *   - `slide`  → backdrop fades, content glides up from the bottom
 *   - `fade`   → backdrop fades, content fades + scales in (dialogs)
 *   - full-screen (`transparent` off) → page slides up, or fades for `fade`
 *
 * Callers should leave their own backdrop views transparent (they remain
 * useful as tap-to-dismiss areas); the dim layer is drawn here.
 */
export function AnimatedModal({
  visible = true,
  animationType = 'fade',
  transparent = false,
  backdropColor,
  onDismissed,
  children,
  ...rest
}: AnimatedModalProps) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;
  const closingRef = useRef(false);

  const [rendered, setRendered] = useState(() => visible && closingCount === 0);

  const isPage = !transparent;
  const slides = animationType === 'slide';

  const stopClosing = () => {
    if (closingRef.current) {
      closingRef.current = false;
      endClosing();
    }
  };

  // Mount the native modal when asked to, once no other modal is closing.
  useEffect(() => {
    if (!visible || rendered) return;
    if (closingCount === 0) {
      setRendered(true);
      return;
    }
    const open = () => {
      if (visibleRef.current) setRendered(true);
    };
    waitingToOpen.add(open);
    return () => {
      waitingToOpen.delete(open);
    };
  }, [visible, rendered]);

  // Run the enter / exit animation.
  useEffect(() => {
    if (!rendered) return;
    progress.stopAnimation();

    if (visible) {
      stopClosing();
      if (animationType === 'none') {
        progress.setValue(1);
        return;
      }
      const enter =
        slides || isPage
          ? Animated.timing(progress, {
              toValue: 1,
              duration: 380,
              easing: EASE_OUT,
              useNativeDriver: true,
            })
          : Animated.spring(progress, {
              toValue: 1,
              damping: 18,
              stiffness: 240,
              mass: 0.9,
              useNativeDriver: true,
            });
      enter.start();
      return;
    }

    const finish = () => {
      setRendered(false);
      stopClosing();
      onDismissedRef.current?.();
    };

    if (animationType === 'none') {
      progress.setValue(0);
      finish();
      return;
    }

    if (!closingRef.current) {
      closingRef.current = true;
      beginClosing();
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: slides ? 260 : 180,
      easing: EASE_IN,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visibleRef.current) finish();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, rendered, animationType, slides, isPage, progress]);

  // Never leave the coordinator waiting on an unmounted modal.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => stopClosing(), []);

  const fadeIn = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  let contentAnim;
  if (slides) {
    contentAnim = {
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [height, 0],
          }),
        },
      ],
    };
  } else if (isPage) {
    contentAnim = { opacity: fadeIn };
  } else {
    contentAnim = {
      opacity: fadeIn,
      transform: [
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
          }),
        },
      ],
    };
  }

  const dim =
    backdropColor ?? (slides ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.6)');

  return (
    <Modal {...rest} visible={rendered} transparent animationType="none">
      {!isPage && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dim, opacity: fadeIn },
          ]}
        />
      )}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.fill,
          isPage && { backgroundColor: theme.BG },
          contentAnim,
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export default AnimatedModal;
