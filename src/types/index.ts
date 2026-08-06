export type Player = {
  id: string
  name: string
  number: number | null
  position: string | null
  is_pitcher: boolean
  notes: string | null
  created_at: string
}

export type Game = {
  id: string
  date: string
  start_time: string | null
  opponent: string
  venue: string | null
  tournament: string | null
  score_us: number
  score_them: number
  // O = その他（中止・没収試合など。勝敗には数えないが試合数には含める）
  result: 'W' | 'L' | 'D' | 'O' | null
  notes: string | null
  innings_us: number[] | null
  innings_them: number[] | null
  is_home: boolean
  game_type: 'official' | 'practice' | 'other' | null
  created_at: string
  // 新規登録・編集のたびにDBのトリガーで更新される（フッターの更新日時に使用）
  updated_at: string
}

export type BattingStat = {
  id: string
  game_id: string
  player_id: string
  batting_order: number | null
  position: string | null
  ab: number
  hits: number
  doubles: number
  triples: number
  hr: number
  rbi: number
  runs: number
  bb: number
  k: number
  sb: number
  players?: Player
}

export type PitchingStat = {
  id: string
  game_id: string
  player_id: string
  is_win: boolean
  is_hold: boolean
  is_save: boolean
  is_loss: boolean
  ip: number
  pitch_count: number
  runs: number
  er: number
  is_cg: boolean
  is_sho: boolean
  hits_allowed: number
  hr_allowed: number
  k: number
  bb: number
  hbp: number
  balk: number
  wp: number
  players?: Player
}
