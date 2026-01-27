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

export function useWanikani(apiToken) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!apiToken) return;

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

      // Calculate average days per level
      let avgDaysPerLevel = null;
      if (levelTimeline.length >= 2) {
        const levelDurations = [];
        for (let i = 1; i < levelTimeline.length; i++) {
          const prev = levelTimeline[i - 1];
          const curr = levelTimeline[i];
          const daysSpent = (curr.startedAt - prev.startedAt) / (1000 * 60 * 60 * 24);
          if (daysSpent > 0 && daysSpent < 365) {
            levelDurations.push(daysSpent);
          }
        }
        if (levelDurations.length > 0) {
          avgDaysPerLevel = levelDurations.reduce((a, b) => a + b, 0) / levelDurations.length;
        }
      }

      // Calculate current level progress
      // For level progress, we care about kanji specifically (90% kanji at Guru = level up)
      // But for a general progress bar, show all items passed vs total
      const currentLevelAssignments = assignments.filter(
        a => a.data.level === user.level
      );
      const currentLevelPassed = currentLevelAssignments.filter(
        a => a.data.passed_at !== null
      ).length;
      const currentLevelStarted = currentLevelAssignments.filter(
        a => a.data.started_at !== null
      ).length;
      const currentLevelTotal = currentLevelAssignments.length;

      // Reviews due
      const reviewsDue = summary.reviews.reduce((sum, r) => sum + r.subject_ids.length, 0);
      const lessonsDue = summary.lessons.reduce((sum, l) => sum + l.subject_ids.length, 0);

      setData({
        user,
        levelTimeline,
        srsBreakdown,
        categoryTotals,
        subjectTypeCounts,
        accuracy,
        avgDaysPerLevel,
        currentLevelProgress: {
          passed: currentLevelPassed,
          started: currentLevelStarted,
          total: currentLevelTotal,
        },
        reviewsDue,
        lessonsDue,
        totalItems: assignments.filter(a => a.data.srs_stage > 0).length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
