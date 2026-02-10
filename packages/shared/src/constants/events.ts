// Client -> Server
export const C2S = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_READY: 'room:ready',
  ROOM_START: 'room:start',
  ROOM_KICK: 'room:kick',
  ROOM_SETTINGS: 'room:settings',
  ROOM_RECONNECT: 'room:reconnect',
  GAME_PLAY: 'game:play',
  GAME_PASS: 'game:pass',
  GAME_REMATCH: 'game:rematch',
  CHAT_MESSAGE: 'chat:message',
} as const;

// Server -> Client
export const S2C = {
  ROOM_UPDATED: 'room:updated',
  ROOM_PLAYER_JOINED: 'room:player_joined',
  ROOM_PLAYER_LEFT: 'room:player_left',
  ROOM_PLAYER_READY: 'room:player_ready',
  ROOM_KICKED: 'room:kicked',
  ROOM_SETTINGS_UPDATED: 'room:settings_updated',
  GAME_STATE: 'game:state',
  GAME_EVENT: 'game:event',
  GAME_CARDS_PLAYED: 'game:cards_played',
  GAME_PLAYER_PASSED: 'game:player_passed',
  GAME_ROUND_WON: 'game:round_won',
  GAME_PLAYER_FINISHED: 'game:player_finished',
  GAME_OVER: 'game:over',
  GAME_INSTANT_WIN: 'game:instant_win',
  CHAT_MESSAGE: 'chat:message',
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',
  ERROR: 'error',
} as const;
