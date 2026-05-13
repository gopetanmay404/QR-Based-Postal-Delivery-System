import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const socket = socketService.connect(token);
        socketRef.current = socket;

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        return () => {
          socketService.disconnect();
          setConnected(false);
        };
      }
    }
  }, [user]);

  const joinDelivery = useCallback((deliveryId) => {
    socketService.joinDelivery(deliveryId);
  }, []);

  const leaveDelivery = useCallback((deliveryId) => {
    socketService.leaveDelivery(deliveryId);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinDelivery, leaveDelivery }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
