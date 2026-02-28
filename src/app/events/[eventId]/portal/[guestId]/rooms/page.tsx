"use client";

import { useParams } from "next/navigation";
import RoomMappingDashboard from "@/components/room-mapping/RoomMappingDashboard";

export default function RoomsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  if (!eventId) {
    return <div className="p-8 text-center text-red-600">Event Context Missing</div>;
  }

  return (
    <div className="pb-20">
        <RoomMappingDashboard eventId={eventId} role="head_guest" />
    </div>
  );
}
