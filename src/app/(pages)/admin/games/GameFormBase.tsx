'use client'

import { useState } from 'react'
import { errorMessage } from '@/lib/errorMessage'
import { createClient } from '@/lib/supabase/client'
import type { Player, Game } from '@/types'

// 試合入力（新規）と試合編集で共有するフォーム本体。
// 差分（初期値の有無・保存先の違い）は props と onSave コールバックで吸収する。

type BattingRow = {
  player_id: string
  batting_order: number | ''
  pa: number | ''
  ab: number | ''
  hits: number | ''
  hr: number | ''
  rbi: number | ''
  runs: number | ''
  sb: number | ''
  doubles: number | ''
  triples: number | ''
  risp_ab: number | ''
  risp_hits: number | ''
  k: number | ''
  bb: number | ''
  hbp: number | ''
  sac_bunt: number | ''
  sac_fly: number | ''
  gidp: number | ''
  reach_on_error: number | ''
  errors: number | ''
  cs: number | ''
}

type PitchingRow = {
  player_id: string
  is_win: boolean
  is_hold: boolean
  is_save: boolean
  is_loss: boolean
  ip: number | ''
  pitch_count: number | ''
  runs: number | ''
  er: number | ''
  is_cg: boolean
  is_sho: boolean
  hits_allowed: number | ''
  hr_allowed: number | ''
  k: number | ''
  bb: number | ''
  hbp: number | ''
  balk: number | ''
  wp: number | ''
}

export type GameFields = {
  date: string
  start_time: string | null
  opponent: string
  venue: string | null
  tournament: string | null
  score_us: number
  score_them: number
  result: 'W' | 'L' | 'D' | null
  notes: string | null
  innings_us: (number | null)[] | null
  innings_them: (number | null)[] | null
  is_home: boolean
  game_type: 'official' | 'practice' | 'other' | null
}

export type BattingSaveRow = {
  player_id: string
  batting_order: number | null
  pa: number
  ab: number
  hits: number
  hr: number
  rbi: number
  runs: number
  sb: number
  doubles: number
  triples: number
  risp_ab: number
  risp_hits: number
  k: number
  bb: number
  hbp: number
  sac_bunt: number
  sac_fly: number
  gidp: number
  reach_on_error: number
  errors: number
  cs: number
}

export type PitchingSaveRow = {
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
}

export type GameSavePayload = {
  game: GameFields
  batting: BattingSaveRow[]
  pitching: PitchingSaveRow[]
}

type Supabase = ReturnType<typeof createClient>

// 対戦相手・大会名をマスタへ自動登録（次回から候補に出す）。失敗しても保存処理は止めない
export async function registerMasters(supabase: Supabase, game: { opponent: string; tournament: string | null }) {
  if (game.opponent) {
    await supabase.from('opponents').upsert({ name: game.opponent }, { onConflict: 'name', ignoreDuplicates: true })
  }
  if (game.tournament) {
    await supabase.from('tournaments').upsert({ name: game.tournament }, { onConflict: 'name', ignoreDuplicates: true })
  }
}

const emptyBatting = (): BattingRow => ({
  player_id: '', batting_order: '',
  pa: '', ab: '', hits: '', hr: '', rbi: '', runs: '', sb: '',
  doubles: '', triples: '', risp_ab: '', risp_hits: '',
  k: '', bb: '', hbp: '', sac_bunt: '', sac_fly: '',
  gidp: '', reach_on_error: '', errors: '', cs: '',
})

const emptyPitching = (): PitchingRow => ({
  player_id: '',
  is_win: false, is_hold: false, is_save: false, is_loss: false,
  ip: '', pitch_count: '', runs: '', er: '',
  is_cg: false, is_sho: false,
  hits_allowed: '', hr_allowed: '', k: '', bb: '', hbp: '', balk: '', wp: '',
})

const battingHeaders = [
  '打順', '打席', '打数', '安打', '本塁打', '打点', '得点', '盗塁',
  '二塁打', '三塁打', '得点圏打数', '得点圏安打',
  '三振', '四球', '死球', '犠打', '犠飛', '併殺打', '敵失', '失策', '盗塁阻止',
]

const numericBattingFields = [
  'pa', 'ab', 'hits', 'hr', 'rbi', 'runs', 'sb',
  'doubles', 'triples', 'risp_ab', 'risp_hits',
  'k', 'bb', 'hbp', 'sac_bunt', 'sac_fly',
  'gidp', 'reach_on_error', 'errors', 'cs',
] as const

const numericPitchingFields = ['ip', 'pitch_count', 'runs', 'er', 'hits_allowed', 'hr_allowed', 'k', 'bb', 'hbp', 'balk', 'wp'] as const
const pitchingHeaders = ['投球回', '投球数', '失点', '自責点', '被安打', '被本塁打', '奪三振', '与四球', '与死球', 'ボーク', '暴投']
const booleanPitchingFields = [
  { field: 'is_win', label: '勝' },
  { field: 'is_hold', label: 'H' },
  { field: 'is_save', label: 'S' },
  { field: 'is_loss', label: '敗' },
  { field: 'is_cg', label: '完投' },
  { field: 'is_sho', label: '完封' },
] as const

// 開始時間の選択肢（7:00〜20:00 の1時間刻み。それ以外は「その他」で自由入力）
const TIME_OPTIONS = Array.from({ length: 14 }, (_, i) => `${String(7 + i).padStart(2, '0')}:00`)

function toVal(v: unknown): number | '' {
  if (v === null || v === undefined || v === '') return ''
  return Number(v)
}

type Props = {
  players: Player[]
  // 入力候補（datalist）。編集画面など不要な場合は省略可
  opponents?: string[]
  tournaments?: string[]
  // 編集時のみ渡す初期値。省略時は空のフォーム（新規入力）
  initialGame?: Game
  initialBatting?: Record<string, unknown>[]
  initialPitching?: Record<string, unknown>[]
  submitLabel: string
  // 保存処理（insert / update+RPC の差分はラッパー側で実装）。失敗時は throw する
  onSave: (payload: GameSavePayload) => Promise<void>
}

export default function GameFormBase({
  players,
  opponents = [],
  tournaments = [],
  initialGame,
  initialBatting = [],
  initialPitching = [],
  submitLabel,
  onSave,
}: Props) {
  const pitchers = players.filter(p => p.is_pitcher)
  // 投手登録された選手＋既に選択済みの選手（登録解除されても表示を維持）
  const pitcherOptions = (selectedId: string) =>
    pitchers.some(p => p.id === selectedId)
      ? pitchers
      : [...pitchers, ...players.filter(p => p.id === selectedId)]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // time 型は "18:00:00" 形式で返るので HH:MM へ切り詰める
  const initialStartTime = (initialGame?.start_time ?? '').slice(0, 5)
  // 選択肢に無い時刻が保存済みなら「その他」（自由入力）モードで開く
  const [customStartTime, setCustomStartTime] = useState(
    initialStartTime !== '' && !TIME_OPTIONS.includes(initialStartTime)
  )

  const [gameInfo, setGameInfo] = useState({
    date: initialGame?.date ?? '',
    start_time: initialStartTime,
    opponent: initialGame?.opponent ?? '',
    venue: initialGame?.venue ?? '',
    tournament: initialGame?.tournament ?? '',
    score_us: (initialGame?.score_us ?? '') as number | '',
    score_them: (initialGame?.score_them ?? '') as number | '',
    result: (initialGame?.result ?? '') as 'W' | 'L' | 'D' | '',
    notes: initialGame?.notes ?? '',
    is_home: initialGame?.is_home ?? false,
    game_type: (initialGame?.game_type ?? '') as 'official' | 'practice' | 'other' | '',
  })

  const toInningArr = (arr: number[] | null | undefined): (number | '')[] => {
    const base = Array<number | ''>(9).fill('')
    if (!arr) return base
    return base.map((_, i) => (arr[i] != null ? arr[i] : ''))
  }
  type InningRow = { team: 'us' | 'them'; scores: (number | '')[] }
  const [inningRows, setInningRows] = useState<InningRow[]>([
    { team: 'us', scores: toInningArr(initialGame?.innings_us) },
    { team: 'them', scores: toInningArr(initialGame?.innings_them) },
  ])
  const updateInningScore = (rowIdx: number, col: number, val: number | '') =>
    setInningRows(rows => rows.map((row, i) => i === rowIdx
      ? { ...row, scores: row.scores.map((v, j) => j === col ? val : v) }
      : row))
  const swapTeam = (rowIdx: number, newTeam: 'us' | 'them') =>
    setInningRows(rows => rows.map((row, i) => ({
      ...row, team: i === rowIdx ? newTeam : (newTeam === 'us' ? 'them' : 'us'),
    })))

  const [battingRows, setBattingRows] = useState<BattingRow[]>(
    initialBatting.length > 0
      ? initialBatting.map(s => ({
          player_id: String(s.player_id ?? ''),
          batting_order: toVal(s.batting_order),
          pa: toVal(s.pa), ab: toVal(s.ab), hits: toVal(s.hits),
          hr: toVal(s.hr), rbi: toVal(s.rbi), runs: toVal(s.runs),
          sb: toVal(s.sb), doubles: toVal(s.doubles), triples: toVal(s.triples),
          risp_ab: toVal(s.risp_ab), risp_hits: toVal(s.risp_hits),
          k: toVal(s.k), bb: toVal(s.bb), hbp: toVal(s.hbp),
          sac_bunt: toVal(s.sac_bunt), sac_fly: toVal(s.sac_fly),
          gidp: toVal(s.gidp), reach_on_error: toVal(s.reach_on_error),
          errors: toVal(s.errors), cs: toVal(s.cs),
        }))
      : Array.from({ length: 9 }, emptyBatting)
  )

  const [pitchingRows, setPitchingRows] = useState<PitchingRow[]>(
    initialPitching.length > 0
      ? initialPitching.map(s => ({
          player_id: String(s.player_id ?? ''),
          is_win: Boolean(s.is_win), is_hold: Boolean(s.is_hold),
          is_save: Boolean(s.is_save), is_loss: Boolean(s.is_loss),
          ip: toVal(s.ip), pitch_count: toVal(s.pitch_count),
          runs: toVal(s.runs), er: toVal(s.er),
          is_cg: Boolean(s.is_cg), is_sho: Boolean(s.is_sho),
          hits_allowed: toVal(s.hits_allowed), hr_allowed: toVal(s.hr_allowed),
          k: toVal(s.k), bb: toVal(s.bb),
          hbp: toVal(s.hbp), balk: toVal(s.balk), wp: toVal(s.wp),
        }))
      : [emptyPitching()]
  )

  const updateBatting = (i: number, field: keyof BattingRow, value: unknown) =>
    setBattingRows(rows => rows.map((row, j) => j === i ? { ...row, [field]: value } : row))

  const updatePitching = (i: number, field: keyof PitchingRow, value: unknown) =>
    setPitchingRows(rows => rows.map((row, j) => j === i ? { ...row, [field]: value } : row))

  const toNum = (v: number | '') => v === '' ? 0 : Number(v)

  // イニング別スコアが入力されている場合、チームスコアと結果はそこから自動算出して統一する
  const inningTotal = (scores: (number | '')[]) =>
    scores.reduce<number>((s, v) => s + (v === '' ? 0 : Number(v)), 0)
  const hasInnings = inningRows.some(r => r.scores.some(v => v !== ''))
  const usRow = inningRows.find(r => r.team === 'us')!
  const themRow = inningRows.find(r => r.team === 'them')!
  const scoreUs: number | '' = hasInnings ? inningTotal(usRow.scores) : gameInfo.score_us
  const scoreThem: number | '' = hasInnings ? inningTotal(themRow.scores) : gameInfo.score_them
  const derivedResult: 'W' | 'L' | 'D' | '' =
    scoreUs !== '' && scoreThem !== ''
      ? (scoreUs > scoreThem ? 'W' : scoreUs < scoreThem ? 'L' : 'D')
      : ''
  const result = derivedResult || gameInfo.result

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: GameSavePayload = {
        game: {
          date: gameInfo.date,
          start_time: gameInfo.start_time || null,
          opponent: gameInfo.opponent,
          venue: gameInfo.venue || null,
          tournament: gameInfo.tournament || null,
          score_us: toNum(scoreUs),
          score_them: toNum(scoreThem),
          result: result || null,
          notes: gameInfo.notes || null,
          innings_us: hasInnings ? usRow.scores.map(v => v === '' ? null : Number(v)) : null,
          innings_them: hasInnings ? themRow.scores.map(v => v === '' ? null : Number(v)) : null,
          is_home: gameInfo.is_home,
          game_type: gameInfo.game_type || null,
        },
        batting: battingRows
          .filter(r => r.player_id && r.pa !== '')
          .map(r => ({
            player_id: r.player_id,
            batting_order: r.batting_order !== '' ? Number(r.batting_order) : null,
            pa: toNum(r.pa), ab: toNum(r.ab), hits: toNum(r.hits),
            hr: toNum(r.hr), rbi: toNum(r.rbi), runs: toNum(r.runs),
            sb: toNum(r.sb), doubles: toNum(r.doubles), triples: toNum(r.triples),
            risp_ab: toNum(r.risp_ab), risp_hits: toNum(r.risp_hits),
            k: toNum(r.k), bb: toNum(r.bb), hbp: toNum(r.hbp),
            sac_bunt: toNum(r.sac_bunt), sac_fly: toNum(r.sac_fly),
            gidp: toNum(r.gidp), reach_on_error: toNum(r.reach_on_error),
            errors: toNum(r.errors), cs: toNum(r.cs),
          })),
        pitching: pitchingRows
          .filter(r => r.player_id && r.ip !== '')
          .map(r => ({
            player_id: r.player_id,
            is_win: r.is_win, is_hold: r.is_hold, is_save: r.is_save, is_loss: r.is_loss,
            ip: toNum(r.ip), pitch_count: toNum(r.pitch_count),
            runs: toNum(r.runs), er: toNum(r.er),
            is_cg: r.is_cg, is_sho: r.is_sho,
            hits_allowed: toNum(r.hits_allowed), hr_allowed: toNum(r.hr_allowed),
            k: toNum(r.k), bb: toNum(r.bb),
            hbp: toNum(r.hbp), balk: toNum(r.balk), wp: toNum(r.wp),
          })),
      }

      await onSave(payload)
    } catch (err: unknown) {
      setError(`保存に失敗しました: ${errorMessage(err)}`)
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-100 disabled:text-gray-500'
  const cellCls = 'rounded-lg border border-gray-300 py-1 text-sm w-11 text-center transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 試合情報 */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-4 border-l-4 border-band pl-2.5 font-bold text-gray-900">試合情報</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
            <input type="date" required value={gameInfo.date}
              onChange={e => setGameInfo({ ...gameInfo, date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
            <select
              value={customStartTime ? 'custom' : gameInfo.start_time}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setCustomStartTime(true)
                  setGameInfo({ ...gameInfo, start_time: '' })
                } else {
                  setCustomStartTime(false)
                  setGameInfo({ ...gameInfo, start_time: e.target.value })
                }
              }}
              className={inputCls}
            >
              <option value="">未定</option>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">その他</option>
            </select>
            {customStartTime && (
              <input type="time" value={gameInfo.start_time}
                onChange={e => setGameInfo({ ...gameInfo, start_time: e.target.value })}
                className={`${inputCls} mt-2`} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">対戦相手 *</label>
            <input type="text" required placeholder="〇〇チーム" value={gameInfo.opponent}
              onChange={e => setGameInfo({ ...gameInfo, opponent: e.target.value })}
              list={opponents.length > 0 ? 'opponent-suggestions' : undefined} className={inputCls} />
            {opponents.length > 0 && (
              <datalist id="opponent-suggestions">
                {opponents.map(name => <option key={name} value={name} />)}
              </datalist>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">大会名</label>
            <input type="text" placeholder="〇〇リーグ" value={gameInfo.tournament}
              onChange={e => setGameInfo({ ...gameInfo, tournament: e.target.value })}
              list={tournaments.length > 0 ? 'tournament-suggestions' : undefined} className={inputCls} />
            {tournaments.length > 0 && (
              <datalist id="tournament-suggestions">
                {tournaments.map(name => <option key={name} value={name} />)}
              </datalist>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">試合種別</label>
            <select value={gameInfo.game_type}
              onChange={e => setGameInfo({ ...gameInfo, game_type: e.target.value as 'official' | 'practice' | 'other' | '' })} className={inputCls}>
              <option value="">選択</option>
              <option value="official">公式戦</option>
              <option value="practice">練習試合</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">球場</label>
            <input type="text" placeholder="〇〇球場" value={gameInfo.venue}
              onChange={e => setGameInfo({ ...gameInfo, venue: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">先攻 / 後攻</label>
            <select value={gameInfo.is_home ? 'home' : 'away'}
              onChange={e => setGameInfo({ ...gameInfo, is_home: e.target.value === 'home' })} className={inputCls}>
              <option value="away">先攻</option>
              <option value="home">後攻</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">後攻の最終回裏は不要なら「×」、サヨナラ勝ちは「得点+x」で表示されます</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">結果</label>
            <select value={result} disabled={derivedResult !== ''}
              onChange={e => setGameInfo({ ...gameInfo, result: e.target.value as 'W' | 'L' | 'D' | '' })} className={inputCls}>
              <option value="">選択</option>
              <option value="W">勝利</option>
              <option value="L">敗戦</option>
              <option value="D">引分</option>
            </select>
            {derivedResult !== '' && <p className="mt-1 text-xs text-gray-400">スコアから自動判定されます</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">自チームスコア</label>
            <input type="number" min="0" value={scoreUs} disabled={hasInnings}
              onChange={e => setGameInfo({ ...gameInfo, score_us: e.target.value === '' ? '' : Number(e.target.value) })} className={inputCls} />
            {hasInnings && <p className="mt-1 text-xs text-gray-400">イニング別スコアの合計から自動入力されます</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">相手スコア</label>
            <input type="number" min="0" value={scoreThem} disabled={hasInnings}
              onChange={e => setGameInfo({ ...gameInfo, score_them: e.target.value === '' ? '' : Number(e.target.value) })} className={inputCls} />
            {hasInnings && <p className="mt-1 text-xs text-gray-400">イニング別スコアの合計から自動入力されます</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea rows={2} value={gameInfo.notes}
              onChange={e => setGameInfo({ ...gameInfo, notes: e.target.value })} className={inputCls} />
          </div>
        </div>
      </div>

      {/* イニング別スコア */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-1 border-l-4 border-band pl-2.5 font-bold text-gray-900">イニング別スコア</h2>
        <p className="mb-4 pl-3.5 text-xs text-gray-400">入力すると自チームスコア・相手スコア・結果に自動反映されます</p>
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="text-gray-500 text-center">
                <th className="pb-2 pr-3 text-left"></th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} className="pb-2 px-1 w-10">{i + 1}</th>
                ))}
                <th className="pb-2 px-2 font-bold text-gray-700">R</th>
              </tr>
            </thead>
            <tbody>
              {inningRows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="py-1 pr-2">
                    <select
                      value={row.team}
                      onChange={e => swapTeam(rowIdx, e.target.value as 'us' | 'them')}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 w-36"
                    >
                      <option value="us">小雀シーガーズ</option>
                      <option value="them">{gameInfo.opponent || '対戦相手'}</option>
                    </select>
                  </td>
                  {row.scores.map((val, i) => (
                    <td key={i} className="py-1 px-1">
                      <input
                        type="number" min="0" max="99" value={val}
                        onChange={e => updateInningScore(rowIdx, i, e.target.value === '' ? '' : Number(e.target.value))}
                        className="rounded-lg border border-gray-300 py-1 text-sm w-10 text-center transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                      />
                    </td>
                  ))}
                  <td className="py-1 px-2 text-center font-bold text-gray-800">
                    {row.scores.reduce<number>((s, v) => s + (v === '' ? 0 : Number(v)), 0) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 打撃成績 */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="border-l-4 border-band pl-2.5 font-bold text-gray-900">打撃成績</h2>
          <button type="button" onClick={() => setBattingRows([...battingRows, emptyBatting()])}
            className="text-sm text-blue-600 hover:underline">+ 行追加</button>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="text-gray-500 border-b text-center">
                <th className="pb-2 pr-2 text-left whitespace-nowrap sticky left-0 bg-gray-50 z-10">選手</th>
                {battingHeaders.map(h => (
                  <th key={h} className="pb-2 px-1 whitespace-nowrap text-xs font-medium">{h}</th>
                ))}
                <th className="pb-2 pl-1"></th>
              </tr>
            </thead>
            <tbody>
              {battingRows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1 pr-2 sticky left-0 bg-white z-10">
                    <select value={row.player_id} onChange={e => updateBatting(i, 'player_id', e.target.value)}
                      className="rounded-lg border border-gray-300 px-1.5 py-1 text-sm w-28 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40">
                      <option value="">選択</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  {/* 打順 */}
                  <td className="py-1 px-1">
                    <input type="number" min="1" max="20" value={row.batting_order}
                      onChange={e => updateBatting(i, 'batting_order', e.target.value === '' ? '' : Number(e.target.value))}
                      className={cellCls} />
                  </td>
                  {/* 数値列 */}
                  {numericBattingFields.map(field => (
                    <td key={field} className="py-1 px-1">
                      <input type="number" min="0" value={row[field] as string | number}
                        onChange={e => updateBatting(i, field, e.target.value === '' ? '' : Number(e.target.value))}
                        className={cellCls} />
                    </td>
                  ))}
                  <td className="py-1 pl-2">
                    {battingRows.length > 1 && (
                      <button type="button" onClick={() => setBattingRows(rows => rows.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-xs whitespace-nowrap">削除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 投手成績 */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="border-l-4 border-band pl-2.5 font-bold text-gray-900">投手成績</h2>
          <button type="button" onClick={() => setPitchingRows([...pitchingRows, emptyPitching()])}
            className="text-sm text-blue-600 hover:underline">+ 行追加</button>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="text-gray-500 border-b text-center">
                <th className="pb-2 pr-2 text-left whitespace-nowrap sticky left-0 bg-gray-50 z-10">選手</th>
                {booleanPitchingFields.map(({ label }) => (
                  <th key={label} className="pb-2 px-1 whitespace-nowrap text-xs font-medium w-8">{label}</th>
                ))}
                {pitchingHeaders.map(h => (
                  <th key={h} className="pb-2 px-1 whitespace-nowrap text-xs font-medium">{h}</th>
                ))}
                <th className="pb-2 pl-1"></th>
              </tr>
            </thead>
            <tbody>
              {pitchingRows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1 pr-2 sticky left-0 bg-white z-10">
                    <select value={row.player_id} onChange={e => updatePitching(i, 'player_id', e.target.value)}
                      className="rounded-lg border border-gray-300 px-1.5 py-1 text-sm w-28 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40">
                      <option value="">選択</option>
                      {pitcherOptions(row.player_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  {booleanPitchingFields.map(({ field }) => (
                    <td key={field} className="py-1 px-1 text-center">
                      <input type="checkbox" checked={row[field] as boolean}
                        onChange={e => updatePitching(i, field, e.target.checked)} />
                    </td>
                  ))}
                  {numericPitchingFields.map(field => (
                    <td key={field} className="py-1 px-1">
                      <input type="number" min="0" step={field === 'ip' ? '0.1' : '1'}
                        value={row[field] as string | number}
                        onChange={e => updatePitching(i, field, e.target.value === '' ? '' : Number(e.target.value))}
                        className={cellCls} />
                    </td>
                  ))}
                  <td className="py-1 pl-1">
                    {pitchingRows.length > 1 && (
                      <button type="button" onClick={() => setPitchingRows(rows => rows.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-xs">削除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50">
        {loading ? '保存中...' : submitLabel}
      </button>
    </form>
  )
}
