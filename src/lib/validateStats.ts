// 成績入力の整合性チェック。フォーム入力と JSON 一括入力の両方から使う。
//
// 前提となる記録の流儀（この前提が崩れると塁打数・長打率・OPS が狂う）:
//   - 安打 は二塁打・三塁打・本塁打を含む総安打数（単打 = 安打 − 二塁打 − 三塁打 − 本塁打）
//   - 得点圏打数 は「打数」ベース（四球・死球・犠打・犠飛は含まない）
//   - 敵失（reach_on_error）での出塁は打数に含む
//
// errors は保存を止める。warnings は例外的な記録（打撃妨害など）で正当に起こりうるため、
// 確認のうえ保存できるようにする。

export type StatIssues = { errors: string[]; warnings: string[] }

export type BattingCheckRow = {
  label: string
  pa: number
  ab: number
  hits: number
  doubles: number
  triples: number
  hr: number
  bb: number
  hbp: number
  sac_bunt: number
  sac_fly: number
  k: number
  gidp: number
  reach_on_error: number
  risp_ab: number
  risp_hits: number
}

export type PitchingCheckRow = {
  label: string
  is_win: boolean
  is_loss: boolean
  is_sho: boolean
  ip: number
  runs: number
  er: number
  hits_allowed: number
  hr_allowed: number
}

export function validateBatting(rows: BattingCheckRow[]): StatIssues {
  const errors: string[] = []
  const warnings: string[] = []

  for (const r of rows) {
    const xbh = r.doubles + r.triples + r.hr
    const outsInAb = r.ab - r.hits // 打数のうち安打にならなかった打席

    if (r.hits < xbh) {
      errors.push(
        `${r.label}: 安打(${r.hits}) が 二塁打+三塁打+本塁打(${xbh}) を下回っています。安打は長打を含めた総安打数を入力してください`
      )
    }
    if (r.ab < r.hits) {
      errors.push(`${r.label}: 打数(${r.ab}) が 安打(${r.hits}) を下回っています`)
    }
    if (r.pa < r.ab) {
      errors.push(`${r.label}: 打席(${r.pa}) が 打数(${r.ab}) を下回っています`)
    }
    if (r.k > outsInAb) {
      errors.push(`${r.label}: 三振(${r.k}) が 打数−安打(${outsInAb}) を超えています`)
    }
    if (r.gidp > outsInAb) {
      errors.push(`${r.label}: 併殺打(${r.gidp}) が 打数−安打(${outsInAb}) を超えています`)
    }
    if (r.reach_on_error > outsInAb) {
      errors.push(
        `${r.label}: 敵失(${r.reach_on_error}) が 打数−安打(${outsInAb}) を超えています。敵失での出塁も打数に含めてください`
      )
    }
    if (r.risp_ab > r.ab) {
      errors.push(`${r.label}: 得点圏打数(${r.risp_ab}) が 打数(${r.ab}) を超えています`)
    }
    if (r.risp_hits > r.risp_ab) {
      errors.push(`${r.label}: 得点圏安打(${r.risp_hits}) が 得点圏打数(${r.risp_ab}) を超えています`)
    }
    if (r.risp_hits > r.hits) {
      errors.push(`${r.label}: 得点圏安打(${r.risp_hits}) が 安打(${r.hits}) を超えています`)
    }

    // 打撃妨害など例外はあるが、ほとんどの場合は入力漏れ（犠飛・敵失の未入力など）
    const breakdown = r.ab + r.bb + r.hbp + r.sac_bunt + r.sac_fly
    if (r.pa !== breakdown) {
      warnings.push(
        `${r.label}: 打席(${r.pa}) と 打数+四球+死球+犠打+犠飛(${breakdown}) が一致しません。犠飛・犠打の入力漏れがないか確認してください`
      )
    }
  }

  return { errors, warnings }
}

export function validatePitching(rows: PitchingCheckRow[]): StatIssues {
  const errors: string[] = []
  const warnings: string[] = []

  for (const r of rows) {
    // 投球回は「5.1 = 5回1/3」表記。小数部は .1 / .2 のみ有効（lib/stats.ts の ipToOuts と対）
    const frac = Math.round((r.ip - Math.floor(r.ip)) * 10)
    if (Math.abs(r.ip * 10 - Math.round(r.ip * 10)) > 1e-9 || frac > 2) {
      errors.push(`${r.label}: 投球回(${r.ip}) の小数部は .1（1/3回）か .2（2/3回）のみです`)
    }
    if (r.er > r.runs) {
      errors.push(`${r.label}: 自責点(${r.er}) が 失点(${r.runs}) を超えています`)
    }
    if (r.hr_allowed > r.hits_allowed) {
      errors.push(`${r.label}: 被本塁打(${r.hr_allowed}) が 被安打(${r.hits_allowed}) を超えています`)
    }
    if (r.is_win && r.is_loss) {
      errors.push(`${r.label}: 勝と敗の両方にチェックが入っています`)
    }
    if (r.is_sho && r.runs > 0) {
      errors.push(`${r.label}: 完封なのに失点(${r.runs}) が入力されています`)
    }
  }

  return { errors, warnings }
}

export function mergeIssues(...list: StatIssues[]): StatIssues {
  return {
    errors: list.flatMap(i => i.errors),
    warnings: list.flatMap(i => i.warnings),
  }
}
