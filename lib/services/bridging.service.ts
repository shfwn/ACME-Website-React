import prisma from '../db/prisma';
import { calculateProgress } from '../utils/progress';

/**
 * 1. Directed Acyclic Graph (DAG) Cycle Detection
 * Prevents recursive dependency loops (e.g. Task A -> Task B -> Task A)
 */
export async function checkCyclicDependency(
  targetTaskId: string, // The task that will be blocked
  prerequisiteTaskId: string // The task that must be finished first
): Promise<{ hasCycle: boolean; path: string[] }> {
  if (targetTaskId === prerequisiteTaskId) {
    return { hasCycle: true, path: [targetTaskId, prerequisiteTaskId] };
  }

  const visited = new Set<string>();
  const queue: Array<{ id: string; path: string[] }> = [
    { id: prerequisiteTaskId, path: [targetTaskId, prerequisiteTaskId] }
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.id === targetTaskId) {
      return { hasCycle: true, path: current.path };
    }

    if (!visited.has(current.id)) {
      visited.add(current.id);

      // Find all tasks that current.id depends on (its prerequisites)
      const dependencies = await prisma.taskDependency.findMany({
        where: { taskId: current.id },
        select: { dependsOnTaskId: true }
      });

      for (const dep of dependencies) {
        queue.push({
          id: dep.dependsOnTaskId,
          path: [...current.path, dep.dependsOnTaskId]
        });
      }
    }
  }

  return { hasCycle: false, path: [] };
}

/**
 * 2. Roll-Up Progress Calculation (Stateless On-The-Fly Aggregation)
 * Calculates project completion percentage deterministically
 */
export async function calculateProjectRollup(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      status: {
        select: { isDoneState: true }
      },
      subtasks: {
        select: { isCompleted: true }
      }
    }
  });

  if (!tasks || tasks.length === 0) {
    return { totalTasks: 0, completedTasks: 0, progressPercentage: 0 };
  }

  let totalWeightedScore = 0;
  let completedCount = 0;

  for (const t of tasks) {
    if (t.status.isDoneState) {
      totalWeightedScore += 100;
      completedCount++;
    } else if (t.subtasks && t.subtasks.length > 0) {
      const doneSubtasks = t.subtasks.filter((s: { isCompleted: boolean }) => s.isCompleted).length;
      totalWeightedScore += calculateProgress(doneSubtasks, t.subtasks.length);
    }
  }

  const overallProgress = Math.round(totalWeightedScore / tasks.length);

  return {
    totalTasks: tasks.length,
    completedTasks: completedCount,
    progressPercentage: Math.min(100, Math.max(0, overallProgress))
  };
}

/**
 * 3. Dependency Handoff & Auto-Notification
 * Triggered when a task reaches a completed status (`isDoneState = true`)
 */
export async function handleTaskCompletionHandoff(taskId: string, actorId: string) {
  // 1. Fetch all tasks that were blocked by this task
  const blockedDependencies = await prisma.taskDependency.findMany({
    where: { dependsOnTaskId: taskId },
    include: {
      task: {
        include: {
          assignee: true,
          prerequisites: {
            include: {
              dependsOnTask: {
                include: { status: true }
              }
            }
          }
        }
      },
      dependsOnTask: {
        select: { title: true }
      }
    }
  });

  const notificationsCreated = [];

  for (const dep of blockedDependencies) {
    const blockedTask = dep.task;
    
    // Check if ALL prerequisites for this blocked task are now completed
    const allPrerequisitesDone = blockedTask.prerequisites.every(
      (prereq: { dependsOnTask: { status: { isDoneState: boolean } } }) => prereq.dependsOnTask.status.isDoneState
    );

    if (allPrerequisitesDone && blockedTask.assigneeId) {
      // Create In-App Notification for assignee
      const notif = await prisma.notification.create({
        data: {
          userId: blockedTask.assigneeId,
          actorId: actorId,
          title: 'Tugas Siap Dikerjakan! (Prasyarat Selesai)',
          message: `Semua prasyarat untuk tugas "${blockedTask.title}" telah selesai (termasuk "${dep.dependsOnTask.title}"). Anda sudah bisa mulai mengerjakan.`,
          linkUrl: `/projects/${blockedTask.projectId}?taskId=${blockedTask.id}`
        }
      });
      notificationsCreated.push(notif);
    }
  }

  return notificationsCreated;
}

/**
 * 4. Workload Aggregation Engine
 * Aggregates workload hours per user against weekly capacity
 */
export async function getTeamWorkload(workspaceId: string) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        include: {
          assignedTasks: {
            where: {
              status: { isDoneState: false }
            },
            select: {
              id: true,
              title: true,
              priority: true,
              estimatedHours: true,
              dueDate: true,
              project: {
                select: { id: true, name: true, color: true }
              }
            }
          },
          timeLogs: {
            select: {
              durationSeconds: true,
              createdAt: true
            }
          }
        }
      }
    }
  });

  return members.map(m => {
    const activeTasks = m.user.assignedTasks;
    const totalEstimatedHours = activeTasks.reduce((acc: number, t: { estimatedHours: number | null }) => acc + (t.estimatedHours || 0), 0);
    const capacity = m.user.weeklyCapacityHours || 40;
    const loadPercentage = capacity > 0 ? Math.round((totalEstimatedHours / capacity) * 100) : 0;

    let workloadStatus: 'LIGHT' | 'OPTIMAL' | 'OVERLOAD' = 'OPTIMAL';
    if (loadPercentage < 50) workloadStatus = 'LIGHT';
    else if (loadPercentage > 100) workloadStatus = 'OVERLOAD';

    return {
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      weeklyCapacityHours: capacity,
      totalEstimatedHours,
      loadPercentage,
      workloadStatus,
      activeTasksCount: activeTasks.length,
      tasks: activeTasks
    };
  });
}
