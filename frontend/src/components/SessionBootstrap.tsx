import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocketStore } from '../store/socketStore';
import { attemptAutoReconnect } from '../services/reconnect.service';
import { hasActiveSession } from '../services/localStorage.service';

const SKIP_AUTO_RECONNECT_PATHS = new Set(['/create-room', '/join-room']);

export function SessionBootstrap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeSocket, isInitialized } = useSocketStore();
  const hasAttemptedReconnect = useRef(false);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  useEffect(() => {
    if (!isInitialized || !hasActiveSession()) {
      return;
    }

    if (SKIP_AUTO_RECONNECT_PATHS.has(location.pathname)) {
      return;
    }

    if (hasAttemptedReconnect.current) {
      return;
    }
    hasAttemptedReconnect.current = true;

    let cancelled = false;

    const run = async () => {
      const result = await attemptAutoReconnect();
      if (cancelled || !result.success) {
        return;
      }
      navigate(result.route, { replace: true });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, navigate, location.pathname]);

  return null;
}
