import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: workers });
  } catch (error) {
    console.error("Error fetching workers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const worker = await prisma.worker.create({
      data: {
        name: body.name.trim(),
        role: body.role || "CARWASH",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: worker }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating worker:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Worker with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create worker" },
      { status: 500 }
    );
  }
}