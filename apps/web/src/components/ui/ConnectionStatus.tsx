import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';

export default function ConnectionStatus() {
  const status = useConnectionStore((s) => s.status);
  const attempt = useConnectionStore((s) => s.reconnectAttempt);

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1 text-green-400" title="Connected to server">
        <Wifi size={10} />
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-1 text-yellow-400" title={`Reconnecting (attempt ${attempt})...`}>
        <Loader2 size={10} className="animate-spin" />
        <span className="text-[10px]">Reconnecting</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-red-400" title="Disconnected from server">
      <WifiOff size={10} />
      <span className="text-[10px]">Offline</span>
    </div>
  );
}
