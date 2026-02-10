import { z } from 'zod';

const SuitSchema = z.enum(['spades', 'clubs', 'diamonds', 'hearts']);
const RankSchema = z.enum(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']);

export const CardIdSchema = z.string().regex(
  /^(10|[2-9]|J|Q|K|A)[schd]$/,
  'Invalid card ID format',
);

export const PlayCardsSchema = z.object({
  cardIds: z.array(CardIdSchema).min(1).max(13),
});

export const JoinRoomSchema = z.object({
  code: z.string().length(6).regex(/^[A-HJ-NP-Z2-9]+$/, 'Invalid room code format'),
  playerName: z.string().min(1).max(20).trim().optional(),
});

export const CreateRoomSchema = z.object({
  playerName: z.string().min(1).max(20).trim().optional(),
  settings: z.object({
    maxPlayers: z.number().int().min(2).max(8).optional(),
    instantWins: z.object({
      dragon: z.boolean().optional(),
      fourTwos: z.boolean().optional(),
      sixPairs: z.boolean().optional(),
      fiveConsecutivePairs: z.boolean().optional(),
      threeConsecutiveTriples: z.boolean().optional(),
      twoPlusBombs: z.boolean().optional(),
    }).optional(),
    turnTimeoutSeconds: z.number().int().min(10).max(120).optional(),
    winnerLeads: z.boolean().optional(),
  }).optional().default({}),
});

export const RoomSettingsSchema = z.object({
  settings: z.object({
    maxPlayers: z.number().int().min(2).max(8).optional(),
    instantWins: z.object({
      dragon: z.boolean().optional(),
      fourTwos: z.boolean().optional(),
      sixPairs: z.boolean().optional(),
      fiveConsecutivePairs: z.boolean().optional(),
      threeConsecutiveTriples: z.boolean().optional(),
      twoPlusBombs: z.boolean().optional(),
    }).optional(),
    turnTimeoutSeconds: z.number().int().min(10).max(120).optional(),
    winnerLeads: z.boolean().optional(),
  }),
});

export const KickPlayerSchema = z.object({
  playerId: z.string().min(1).max(50),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(200).trim(),
});

export const ReconnectSchema = z.object({
  code: z.string().length(6).regex(/^[A-HJ-NP-Z2-9]+$/),
  playerId: z.string().min(1).max(50),
});
