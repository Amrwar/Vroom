import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UpdateWorkerSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateWorkerSchema.parse(body);

    const worker = await prisma.worker.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, data: worker });
  } catch (error) {
    console.error('Error updating worker:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update worker' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete by setting isActive to false
    const worker = await prisma.worker.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: worker });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete worker' },
      { status: 500 }
    );
  }
}
