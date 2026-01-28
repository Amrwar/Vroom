import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UpdateWashRecordSchema } from '@/lib/validations';
import { calculateElapsedMinutes } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.washRecord.findUnique({
      where: { id },
      include: { worker: true },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching wash record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wash record' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateWashRecordSchema.parse(body);

    const existing = await prisma.washRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = { ...validated };

    // If washType is being changed to FREE, reset payment fields
    if (validated.washType === 'FREE') {
      updateData.paymentType = null;
      updateData.amountPaid = 0;
    }

    // Recalculate elapsed minutes if times are changing
    if (validated.entryTime || validated.finishTime) {
      const entryTime = validated.entryTime
        ? new Date(validated.entryTime)
        : existing.entryTime;
      const finishTime = validated.finishTime
        ? new Date(validated.finishTime)
        : existing.finishTime;

      if (finishTime && entryTime) {
        updateData.elapsedMinutes = calculateElapsedMinutes(entryTime, finishTime);
      }
    }

    const record = await prisma.washRecord.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.washRecord.update>[0]['data'],
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating wash record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wash record' },
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
    await prisma.washRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting wash record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wash record' },
      { status: 500 }
    );
  }
}
