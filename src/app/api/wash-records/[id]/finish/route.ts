import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FinishWashRecordSchema } from '@/lib/validations';
import { calculateElapsedMinutes } from '@/lib/date-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validated = FinishWashRecordSchema.parse(body);

    const existing = await prisma.washRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'FINISHED') {
      return NextResponse.json(
        { success: false, error: 'Record is already finished' },
        { status: 400 }
      );
    }

    const finishTime = new Date();
    const elapsedMinutes = calculateElapsedMinutes(existing.entryTime, finishTime);

    const updateData: Record<string, unknown> = {
      finishTime,
      elapsedMinutes,
      status: 'FINISHED',
    };

    // Update payment info if provided
    if (validated.paymentType !== undefined) {
      updateData.paymentType = validated.paymentType;
    }
    if (validated.amountPaid !== undefined) {
      updateData.amountPaid = validated.amountPaid;
    }
    if (validated.tipAmount !== undefined) {
      updateData.tipAmount = validated.tipAmount;
    }

    const record = await prisma.washRecord.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.washRecord.update>[0]['data'],
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error finishing wash record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finish wash record' },
      { status: 500 }
    );
  }
}
