import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const record = await prisma.mechanicRecord.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error updating mechanic record:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update mechanic record" },
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

    await prisma.mechanicRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mechanic record:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete mechanic record" },
      { status: 500 }
    );
  }
}