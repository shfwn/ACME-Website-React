/**
 * Safe progress calculator with guard against division by zero
 */
export function calculateProgress(completedCount: number, totalCount: number): number {
  if (!totalCount || totalCount <= 0 || isNaN(totalCount)) {
    return 0;
  }
  const safeCompleted = Math.max(0, completedCount || 0);
  const ratio = safeCompleted / totalCount;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

/**
 * Calculates roll-up task completion score based on status + subtasks
 */
export function calculateTaskWeight(hasSubtasks: boolean, completedSubtasks: number, totalSubtasks: number, isTaskDone: boolean): number {
  if (isTaskDone) return 100;
  if (!hasSubtasks || totalSubtasks === 0) return 0;
  return calculateProgress(completedSubtasks, totalSubtasks);
}
