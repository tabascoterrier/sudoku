import { describe, expect, it } from 'vitest';
import { matchRoute, pathForDifficulty } from './routes';

describe('matchRoute', () => {
  it('matches each difficulty path, with or without a trailing slash', () => {
    expect(matchRoute('/easy/')).toEqual({ name: 'game', difficulty: 'easy' });
    expect(matchRoute('/medium')).toEqual({ name: 'game', difficulty: 'medium' });
    expect(matchRoute('/hard/')).toEqual({ name: 'game', difficulty: 'hard' });
    expect(matchRoute('/expert')).toEqual({ name: 'game', difficulty: 'expert' });
  });

  it('matches the rules and settings pages', () => {
    expect(matchRoute('/rules/')).toEqual({ name: 'rules' });
    expect(matchRoute('/settings/')).toEqual({ name: 'settings' });
  });

  it('defaults the root path to an easy game', () => {
    expect(matchRoute('/')).toEqual({ name: 'game', difficulty: 'easy' });
  });

  it('falls back to not-found for an unknown path', () => {
    expect(matchRoute('/nonsense/')).toEqual({ name: 'not-found' });
  });
});

describe('pathForDifficulty', () => {
  it('builds a trailing-slash path per difficulty', () => {
    expect(pathForDifficulty('easy')).toBe('/easy/');
    expect(pathForDifficulty('expert')).toBe('/expert/');
  });
});
