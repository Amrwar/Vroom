import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { instapayProof } = body;

    const record = await prisma.washRecord.update({
      where: { id },
      data: { instapayProof },
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error uploading proof:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload proof" },
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

    const record = await prisma.washRecord.update({
      where: { id },
      data: { instapayProof: null },
      include: { worker: true },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error deleting proof:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete proof" },
      { status: 500 }
    );
  }
}