import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDateRangeForDay, formatCairoDate } from '@/lib/date-utils';
import { generateExcelReport, getExcelFilename } from '@/lib/excel';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || formatCairoDate(new Date());

    const { start, end } = getDateRangeForDay(date);

    const records = await prisma.washRecord.findMany({
      where: {
        entryTime: {
          gte: start,
          lte: end,
        },
      },
      include: { worker: true },
      orderBy: { entryTime: 'asc' },
    });

    const buffer = await generateExcelReport(records, 'daily', date);
    const filename = getExcelFilename('daily', date);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating daily export:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
