// SPEC §13 flags the real scoring formula as an unresolved open question (no
// backend to reverse-engineer it from). This is an invented value matching
// the one observed data point: the "points" counter jumped from 0 to 50 on
// first hint use (SPEC §7).
export const HINT_COMMIT_SCORE = 50;
