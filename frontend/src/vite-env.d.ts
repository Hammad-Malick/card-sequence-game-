/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface SequenceCheatApi {
  hand: () => void;
  wild: (target?: number | string) => Promise<void>;
  remove: (target?: number | string) => Promise<void>;
  wildAll: () => Promise<void>;
  removeAll: () => Promise<void>;
  help: () => void;
}

interface Window {
  __SEQ__?: SequenceCheatApi;
}
