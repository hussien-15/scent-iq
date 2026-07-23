import { prisma } from '@/lib/prisma';

export function findOrderBySubmissionId(submissionId: string) {
  return prisma.order.findUnique({ where: { submissionId }, select: { id: true } });
}

export function findOrderForStatusChange(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: { include: { perfume: { select: { slug: true } } } } },
  });
}
