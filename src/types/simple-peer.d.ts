declare module 'simple-peer' {
  interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: object;
    offerOptions?: object;
    answerOptions?: object;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
    wrtc?: object;
  }

  export interface Instance {
    signal(data: any): void;
    send(data: string | Uint8Array | ArrayBuffer | Blob): void;
    destroy(err?: Error): void;
    on(event: string, listener: (...args: any[]) => void): this;
    connected: boolean;
  }

  export interface SimplePeer {
    new (opts?: SimplePeerOptions): Instance;
    (opts?: SimplePeerOptions): Instance;
  }

  const SimplePeer: SimplePeer;
  export default SimplePeer;
} 