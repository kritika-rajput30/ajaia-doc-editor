import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/auth";

export async function GET() {
  try {
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
