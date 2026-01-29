import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateWashRecordSchema } from "@/lib/validations";
import { getCairoDayStart, getCairoDayEnd, getCairoMonthStart, getCairoMonthEnd, formatCairoDate } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    let start: Date;
    let end: Date;

    if (date) {
      const targetDate = new Date(date);
      start = getCairoDayStart(targetDate);
      end = getCairoDayEnd(targetDate);
    } else if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const targetDate = new Date(year, monthNum - 1, 1);
      start = getCairoMonthStart(targetDate);
      end = getCairoMonthEnd(targetDate);
    } else {
      const today = new Date();
      start = getCairoDayStart(today);
      end = getCairoDayEnd(today);
    }

    const records = await prisma.washRecord.findMany({
      where: {
        entryTime: {
          gte: start,
          lte: end,
        },
      },
      include: { worker: true },
      orderBy: { entryTime: "desc" },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching wash records:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wash records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWashRecordSchema.parse(body);

    const recordData: Record<string, unknown> = {
      plateNumber: validated.plateNumber,
      carType: validated.carType || null,
      washType: validated.washType,
      amountPaid: validated.washType === "FREE" ? 0 : validated.amountPaid,
      tipAmount: validated.tipAmount || 0,
      notes: validated.notes,
      status: "IN_PROGRESS",
    };

    if (validated.washType === "FREE") {
      recordData.paymentType = null;
    } else if (validated.paymentType) {
      recordData.paymentType = validated.paymentType;
    }

    if (validated.workerId) {
      recordData.workerId = validated.workerId;
    }

    const record = await prisma.washRecord.create({
      data: recordData as Parameters<typeof prisma.washRecord.create>[0]["data"],
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating wash record:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid input data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create wash record" },
      { status: 500 }
    );
  }
}
