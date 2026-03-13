import { useState, useEffect, useCallback } from 'react';
import { createAPI } from '../api/wanikani';

const SRS_STAGES = {
  0: 'Locked',
  1: 'Apprentice 1',
  2: 'Apprentice 2',
  3: 'Apprentice 3',
  4: 'Apprentice 4',
  5: 'Guru 1',
  6: 'Guru 2',
  7: 'Master',
  8: 'Enlightened',
  9: 'Burned',
};

const SRS_CATEGORIES = {
  apprentice: [1, 2, 3, 4],
  guru: [5, 6],
  master: [7],
  enlightened: [8],
  burned: [9],
};

const CACHE_KEY = 'wanikani_cache';
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_MAX_AGE) return null;
    return cached;
  } catch {
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function useWanikani(apiToken) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Load cache on mount
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setData(cached.data);
      setLastFetched(new Date(cached.timestamp));
    }
  }, []);

  const fetchData = useCallback(async (bypassCache = false) => {
    if (!apiToken) return;

    if (!bypassCache) {
      const cached = loadCache();
      if (cached) {
        setData(cached.data);
        setLastFetched(new Date(cached.timestamp));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const api = createAPI(apiToken);

      // Fetch sequentially to avoid rate limiting
      const user = await api.getUser();
      const summary = await api.getSummary();
      const levelProgressions = await api.getLevelProgressions();
      const assignments = await api.getAssignments();
      const reviewStatistics = await api.getReviewStatistics();

      // Process SRS breakdown
      const srsBreakdown = {};
      const subjectTypeCounts = { radical: 0, kanji: 0, vocabulary: 0 };

      for (const assignment of assignments) {
        if (assignment.data.srs_stage > 0) {
          const stage = assignment.data.srs_stage;
          const stageName = SRS_STAGES[stage];
          srsBreakdown[stageName] = (srsBreakdown[stageName] || 0) + 1;
          subjectTypeCounts[assignment.data.subject_type] =
            (subjectTypeCounts[assignment.data.subject_type] || 0) + 1;
        }
      }

      // Calculate category totals
      const categoryTotals = {};
      for (const [category, stages] of Object.entries(SRS_CATEGORIES)) {
        categoryTotals[category] = stages.reduce((sum, stage) => {
          return sum + (srsBreakdown[SRS_STAGES[stage]] || 0);
        }, 0);
      }

      // Calculate accuracy from review statistics
      let totalMeaningCorrect = 0;
      let totalMeaningIncorrect = 0;
      let totalReadingCorrect = 0;
      let totalReadingIncorrect = 0;

      for (const stat of reviewStatistics) {
        totalMeaningCorrect += stat.data.meaning_correct;
        totalMeaningIncorrect += stat.data.meaning_incorrect;
        totalReadingCorrect += stat.data.reading_correct;
        totalReadingIncorrect += stat.data.reading_incorrect;
      }

      const totalCorrect = totalMeaningCorrect + totalReadingCorrect;
      const totalIncorrect = totalMeaningIncorrect + totalReadingIncorrect;
      const totalReviews = totalCorrect + totalIncorrect;
      const accuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;

      // Process level progression for chart
      const levelTimeline = levelProgressions
        .filter(lp => lp.data.passed_at || lp.data.started_at)
        .map(lp => ({
          level: lp.data.level,
          startedAt: new Date(lp.data.started_at),
          passedAt: lp.data.passed_at ? new Date(lp.data.passed_at) : null,
        }))
        .sort((a, b) => a.level - b.level);

      // Calculate average days per level + fastest/slowest
      let avgDaysPerLevel = null;
      let fastestLevel = null;
      let slowestLevel = null;
      if (levelTimeline.length >= 2) {
        const levelDurations = [];
        let fastest = { level: 0, days: Infinity };
        let slowest = { level: 0, days: 0 };

        for (let i = 1; i < levelTimeline.length; i++) {
          const prev = levelTimeline[i - 1];
          const curr = levelTimeline[i];
          const daysSpent = (curr.startedAt - prev.startedAt) / (1000 * 60 * 60 * 24);
          if (daysSpent > 0 && daysSpent < 365) {
            levelDurations.push(daysSpent);
            if (daysSpent < fastest.days) {
              fastest = { level: prev.level, days: daysSpent };
            }
            if (daysSpent > slowest.days) {
              slowest = { level: prev.level, days: daysSpent };
            }
          }
        }
        if (levelDurations.length > 0) {
          avgDaysPerLevel = levelDurations.reduce((a, b) => a + b, 0) / levelDurations.length;
          fastestLevel = fastest;
          slowestLevel = slowest;
        }
      }

      // Calculate estimated completion date
      let estimatedCompletion = null;
      if (avgDaysPerLevel && levelTimeline.length > 0) {
        const levelsRemaining = 60 - user.level;
        const lastLevel = levelTimeline[levelTimeline.length - 1];
        const projectionStart = lastLevel.startedAt.getTime();
        estimatedCompletion = new Date(
          projectionStart + levelsRemaining * avgDaysPerLevel * 24 * 60 * 60 * 1000
        );
      }

      // Calculate current level progress
      // For level progress, we care about kanji specifically (90% kanji at Guru = level up)
      // But for a general progress bar, show all items passed vs total
      const currentLevelAssignments = assignments.filter(
        a => a.data.level === user.level
      );
      // Items that have reached Guru (passed)
      const currentLevelPassed = currentLevelAssignments.filter(
        a => a.data.passed_at !== null
      ).length;
      // Items that have been started (have an SRS stage, meaning lessons done)
      const currentLevelStarted = currentLevelAssignments.filter(
        a => a.data.srs_stage > 0 || a.data.unlocked_at !== null
      ).length;
      const currentLevelTotal = currentLevelAssignments.length;

      // Reviews due
      const reviewsDue = summary.reviews.reduce((sum, r) => sum + r.subject_ids.length, 0);
      const lessonsDue = summary.lessons.reduce((sum, l) => sum + l.subject_ids.length, 0);

      // Top 10 most missed meanings and readings (all time)
      const kanjiAndVocab = reviewStatistics
        .filter(s => s.data.subject_type === 'kanji' || s.data.subject_type === 'vocabulary')
        .map(s => ({
          subjectId: s.data.subject_id,
          type: s.data.subject_type,
          incorrectMeaning: s.data.meaning_incorrect,
          incorrectReading: s.data.reading_incorrect,
        }));

      const topMissedMeanings = [...kanjiAndVocab]
        .filter(s => s.incorrectMeaning > 0)
        .sort((a, b) => b.incorrectMeaning - a.incorrectMeaning)
        .slice(0, 10);

      const topMissedReadings = [...kanjiAndVocab]
        .filter(s => s.incorrectReading > 0)
        .sort((a, b) => b.incorrectReading - a.incorrectReading)
        .slice(0, 10);

      // Top 10 most missed radicals (meanings only — radicals have no readings)
      const topMissedRadicals = reviewStatistics
        .filter(s => s.data.subject_type === 'radical')
        .map(s => ({
          subjectId: s.data.subject_id,
          type: s.data.subject_type,
          incorrectMeaning: s.data.meaning_incorrect,
        }))
        .filter(s => s.incorrectMeaning > 0)
        .sort((a, b) => b.incorrectMeaning - a.incorrectMeaning)
        .slice(0, 10);

      // Fetch subject details for all lists (deduplicated)
      const allTopSubjectIds = [...new Set([
        ...topMissedMeanings.map(s => s.subjectId),
        ...topMissedReadings.map(s => s.subjectId),
        ...topMissedRadicals.map(s => s.subjectId),
      ])];

      let topMissedMeaningsList = [];
      let topMissedReadingsList = [];
      let topMissedRadicalsList = [];
      if (allTopSubjectIds.length > 0) {
        const topSubjects = await api.getSubjects(allTopSubjectIds);
        const topSubjectMap = new Map(topSubjects.map(s => [s.id, { ...s.data, type: s.object }]));

        const enrich = (s) => {
          const subject = topSubjectMap.get(s.subjectId) || {};
          return {
            ...s,
            characters: subject.characters || subject.slug || '?',
            meanings: subject.meanings?.filter(m => m.primary).map(m => m.meaning) || [],
            readings: subject.readings?.filter(rd => rd.primary).map(rd => rd.reading) || [],
            type: subject.type || s.type,
          };
        };

        topMissedMeaningsList = topMissedMeanings.map(enrich);
        topMissedReadingsList = topMissedReadings.map(enrich);
        topMissedRadicalsList = topMissedRadicals.map(enrich);
      }

      // Fetch recent mistakes
      const recentReviews = await api.getRecentReviews(100);
      const reviewsWithMistakes = recentReviews
        .filter(r => r.data.incorrect_meaning_answers > 0 || r.data.incorrect_reading_answers > 0)
        .sort((a, b) => new Date(b.data.created_at) - new Date(a.data.created_at))
        .slice(0, 10);

      // Get subject details for mistakes
      let recentMistakes = [];
      if (reviewsWithMistakes.length > 0) {
        const subjectIds = [...new Set(reviewsWithMistakes.map(r => r.data.subject_id))];
        const subjects = await api.getSubjects(subjectIds);
        // Subject type (object) is on the outer object, data contains the details
        const subjectMap = new Map(subjects.map(s => [s.id, { ...s.data, type: s.object }]));

        recentMistakes = reviewsWithMistakes.map(r => {
          const subject = subjectMap.get(r.data.subject_id) || {};
          return {
            id: r.id,
            subjectId: r.data.subject_id,
            characters: subject.characters || subject.slug || '?',
            meanings: subject.meanings?.filter(m => m.primary).map(m => m.meaning) || [],
            readings: subject.readings?.filter(rd => rd.primary).map(rd => rd.reading) || [],
            type: subject.type || 'unknown',
            incorrectMeaning: r.data.incorrect_meaning_answers,
            incorrectReading: r.data.incorrect_reading_answers,
            reviewedAt: new Date(r.data.created_at),
          };
        });
      }

      const result = {
        user,
        levelTimeline,
        srsBreakdown,
        categoryTotals,
        subjectTypeCounts,
        accuracy,
        avgDaysPerLevel,
        fastestLevel,
        slowestLevel,
        estimatedCompletion,
        currentLevelProgress: {
          passed: currentLevelPassed,
          started: currentLevelStarted,
          total: currentLevelTotal,
        },
        reviewsDue,
        lessonsDue,
        totalItems: assignments.filter(a => a.data.srs_stage > 0).length,
        recentMistakes,
        topMissedMeanings: topMissedMeaningsList,
        topMissedReadings: topMissedReadingsList,
        topMissedRadicals: topMissedRadicalsList,
      };

      saveCache(result);
      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh, lastFetched };
}
