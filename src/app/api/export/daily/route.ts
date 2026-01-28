import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCairoDayStart, getCairoDayEnd, formatCairoDate } from "@/lib/date-utils";
import { generateExcelReport, getExcelFilename } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam || formatCairoDate(new Date());
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const start = getCairoDayStart(targetDate);
    const end = getCairoDayEnd(targetDate);
    const records = await prisma.washRecord.findMany({
      where: { entryTime: { gte: start, lte: end } },
      include: { worker: true },
      orderBy: { entryTime: "asc" },
    });
    const buffer = await generateExcelReport(records, "daily", date);
    const filename = getExcelFilename("daily", date);
    const uint8 = new Uint8Array(buffer);
    return new Response(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating daily export:", error);
    return NextResponse.json({ success: false, error: "Failed to generate export" }, { status: 500 });
  }
}
