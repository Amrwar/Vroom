import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amountPaid, paymentType, notes } = body;

    const paidAmount = amountPaid ?? 0;

    const record = await prisma.washRecord.update({
      where: { id },
      data: {
        status: "CANCELLED",
        finishTime: new Date(),
        amountPaid: paidAmount,
        paymentType: paidAmount > 0 ? paymentType : null,
        paymentReceived: paidAmount > 0,
        notes: notes || null,
      },
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error cancelling wash record:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel wash record" },
      { status: 500 }
    );
  }
}