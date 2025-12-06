import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Proxy to backend on port 8000
    const response = await fetch("http://localhost:8000/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Ingest API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ingest repository" },
      { status: 500 }
    );
  }
}
