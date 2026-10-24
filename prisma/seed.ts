import { PrismaClient, Role, Priority, ActionType } from '@prisma/client';
import { hashSync } from 'bcrypt-ts';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data for task management system...');
  const defaultPasswordHash = hashSync('password123', 10);

  // 1. Create Demo Users
  const userBudi = await prisma.user.upsert({
    where: { email: 'budi@company.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Budi Santoso',
      email: 'budi@company.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      weeklyCapacityHours: 40.0,
    },
  });

  const userSiti = await prisma.user.upsert({
    where: { email: 'siti@company.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Siti Rahma',
      email: 'siti@company.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      weeklyCapacityHours: 35.0,
    },
  });
  const userAndi = await prisma.user.upsert({
    where: { email: 'andi@company.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Andi Pratama',
      email: 'andi@company.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      weeklyCapacityHours: 40.0,
    },
  });

  const userMilt = await prisma.user.upsert({
    where: { email: 'milt1058@gmail.com' },
    update: { passwordHash: defaultPasswordHash, role: Role.MILT },
    create: {
      name: 'MILT Executive',
      email: 'milt1058@gmail.com',
      passwordHash: defaultPasswordHash,
      role: Role.MILT,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      weeklyCapacityHours: 40.0,
    },
  });
  // 2. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-product-team' },
    update: {},
    create: {
      name: 'Acme Product Team',
      slug: 'acme-product-team',
      members: {
        create: [
          { userId: userMilt.id, role: Role.MILT },
          { userId: userBudi.id, role: Role.OWNER },
          { userId: userSiti.id, role: Role.ADMIN },
          { userId: userAndi.id, role: Role.MEMBER },
        ],
      },
    },
  });

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Peluncuran Aplikasi Mobile 2.0',
      description: 'Pengembangan dan rilis antarmuka baru mobile app serta integrasi backend API.',
      color: '#6366F1',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Create Custom Statuses
  const statusBacklog = await prisma.customStatus.create({
    data: { projectId: project.id, name: 'Backlog', orderIndex: 0, color: '#94A3B8', isDoneState: false },
  });
  const statusInProgress = await prisma.customStatus.create({
    data: { projectId: project.id, name: 'In Progress', orderIndex: 1, color: '#3B82F6', isDoneState: false },
  });
  await prisma.customStatus.create({
    data: { projectId: project.id, name: 'In Review', orderIndex: 2, color: '#F59E0B', isDoneState: false },
  });
  const statusApproved = await prisma.customStatus.create({
    data: { projectId: project.id, name: 'Approved / Done', orderIndex: 3, color: '#10B981', isDoneState: true },
  });

  // 5. Create Tasks
  // Task 1: UI Design (Assigned to Siti)
  const taskUI = await prisma.task.create({
    data: {
      projectId: project.id,
      statusId: statusInProgress.id,
      creatorId: userBudi.id,
      assigneeId: userSiti.id,
      title: 'Desain Wireframe & UI Mobile App',
      description: 'Membuat rancangan UI Figma untuk halaman Home, Cart, dan Checkout.',
      priority: Priority.HIGH,
      estimatedHours: 12,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      orderIndex: 0,
      subtasks: {
        create: [
          { title: 'Riset kompetitor & moodboard', isCompleted: true, orderIndex: 0 },
          { title: 'Desain Flow Checkout Figma', isCompleted: true, orderIndex: 1 },
          { title: 'Export asset icon & design tokens', isCompleted: false, orderIndex: 2 },
        ],
      },
    },
  });

  // Task 2: Frontend Coding (Assigned to Andi, Depends on Task 1)
  const taskFrontend = await prisma.task.create({
    data: {
      projectId: project.id,
      statusId: statusBacklog.id,
      creatorId: userBudi.id,
      assigneeId: userAndi.id,
      title: 'Koding Frontend Komponen Checkout',
      description: 'Implementasi komponen checkout di React Native berdasarkan desain Figma dari Siti.',
      priority: Priority.HIGH,
      estimatedHours: 18,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderIndex: 1,
      subtasks: {
        create: [
          { title: 'Setup state management order', isCompleted: false, orderIndex: 0 },
          { title: 'Integrasi form pembayaran', isCompleted: false, orderIndex: 1 },
        ],
      },
    },
  });

  // Create Dependency: taskFrontend depends on taskUI
  await prisma.taskDependency.create({
    data: {
      taskId: taskFrontend.id,
      dependsOnTaskId: taskUI.id,
    },
  });

  // Task 3: Backend API Setup (Assigned to Budi)
  const taskBackend = await prisma.task.create({
    data: {
      projectId: project.id,
      statusId: statusApproved.id,
      creatorId: userBudi.id,
      assigneeId: userBudi.id,
      title: 'Setup API Gateway & Database Neon',
      description: 'Konfigurasi database Serverless PostgreSQL di Neon Tech dan connection pooling.',
      priority: Priority.URGENT,
      estimatedHours: 8,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      orderIndex: 2,
    },
  });

  // 6. Create Docs/Wiki
  await prisma.docWiki.create({
    data: {
      projectId: project.id,
      creatorId: userBudi.id,
      title: 'Panduan Desain & Arsitektur API V2',
      contentMarkdown: `# Panduan Integrasi Mobile 2.0\n\nDokumen ini merangkum endpoint API dan spesifikasi design token untuk mobile developer.\n\n### Standar Token\n- Primary Color: #6366F1\n- API Base URL: \`https://api.acme.com/v2\``,
      linkedTaskIds: [taskUI.id, taskFrontend.id, taskBackend.id],
    },
  });

  // 7. Create Activity Log & Comments
  await prisma.taskComment.create({
    data: {
      taskId: taskUI.id,
      userId: userBudi.id,
      content: 'Pastikan warna tombol checkout sudah sesuai dengan standar WCAG ya @Siti Rahma!',
      mentions: [userSiti.id],
    },
  });

  await prisma.activityLog.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      taskId: taskUI.id,
      actorId: userBudi.id,
      actionType: ActionType.STATUS_CHANGED,
      metadata: { from: 'Backlog', to: 'In Progress' },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
