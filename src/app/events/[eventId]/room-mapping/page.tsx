"use client";

import { useParams } from "next/navigation";
import RoomMappingDashboard from "@/components/room-mapping/RoomMappingDashboard";

export default function RoomMappingPage() {
  const params = useParams();
  const eventId = params?.eventId as string;

  if (!eventId) return null;

  return <RoomMappingDashboard eventId={eventId} role="agent" />;
}
