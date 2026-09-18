import { expect, it } from 'vitest'
import { searchMatches } from './search'
import { adaptRecommendations } from './recommendations'
import { backendMatch, backendResponse } from '../../tests/fixtures/recommendations'

it('searches multiple words and independent categories without changing profile', () => {
  const item = backendMatch()
  item.program = 'Artificial Intelligence and Data Science'
  item.city = 'Алматы'
  const match = adaptRecommendations(backendResponse([item]))[0]
  expect(searchMatches(match, 'data Алматы', 'ai')).toBe(true)
  expect(searchMatches(match, 'data', 'security')).toBe(false)
})
