import { useEffect, useRef } from 'react';

/**
 * Hook to connect any modal, drawer, or overlay view to the browser history stack.
 * Allows Android/iOS edge-swipe back gestures and hardware/browser back buttons
 * to close the active overlay instead of inadvertently closing the web app.
 *
 * Automatically balances browser history if the overlay is closed via an on-screen button.
 */
export function useModalBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalId: string
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isPushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Push an entry onto browser history for this modal
    try {
      window.history.pushState({ modalId, timestamp: Date.now() }, '');
      isPushedRef.current = true;
    } catch (err) {
      console.warn('Failed to push modal history state:', err);
    }

    const handlePopState = () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If closed by on-screen button (not by popstate), pop the state so history remains balanced
      if (isPushedRef.current) {
        isPushedRef.current = false;
        try {
          if (window.history.state?.modalId === modalId) {
            window.history.back();
          }
        } catch (e) {
          console.warn('History back error:', e);
        }
      }
    };
  }, [isOpen, modalId]);
}
