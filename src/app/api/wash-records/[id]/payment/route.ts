import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { paymentReceived } = body;

    const record = await prisma.washRecord.update({
      where: { id },
      data: { paymentReceived },
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}