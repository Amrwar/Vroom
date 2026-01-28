import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CreateWorkerSchema } from '@/lib/validations';

export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, data: workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWorkerSchema.parse(body);

    const existingWorker = await prisma.worker.findUnique({
      where: { name: validated.name },
    });

    if (existingWorker) {
      if (!existingWorker.isActive) {
        const reactivated = await prisma.worker.update({
          where: { id: existingWorker.id },
          data: { isActive: true },
        });
        return NextResponse.json({ success: true, data: reactivated });
      }
      return NextResponse.json(
        { success: false, error: 'Worker already exists' },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.create({
      data: validated,
    });

    return NextResponse.json({ success: true, data: worker }, { status: 201 });
  } catch (error) {
    console.error('Error creating worker:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create worker' },
      { status: 500 }
    );
  }
}
