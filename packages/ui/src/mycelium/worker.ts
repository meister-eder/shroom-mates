// Runs the growth simulation off the main thread.
import { grow } from "./grow";

self.onmessage = (
  ev: MessageEvent<{ id: number; W: number; H: number; compact: boolean }>,
) => {
  const { id, W, H, compact } = ev.data;
  const net = grow(W, H, { compact });
  (self as unknown as Worker).postMessage({ id, net }, [
    net.pos.buffer,
    net.width.buffer,
    net.alpha.buffer,
    net.key.buffer,
    net.kind.buffer,
    net.next.buffer,
  ]);
};
