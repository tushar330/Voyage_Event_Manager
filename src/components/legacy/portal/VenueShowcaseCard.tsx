"use client";

import { CuratedVenue } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface VenueShowcaseCardProps {
  venue: CuratedVenue;
}

export default function VenueShowcaseCard({ venue }: VenueShowcaseCardProps) {
  const params = useParams();
  const eventId = params.eventId as string;
  const guestId = params.guestId as string;

  const isApproved = venue.status === "approved";
  const isCart = venue.status === "cart";
  
  // Highlight approved cards
  const borderClass = isApproved 
    ? "border-green-400 shadow-md ring-2 ring-green-100" 
    : "border-gray-100 hover:border-blue-200 hover:shadow-md";

  return (
    <Link
      href={`/events/${eventId}/portal/${guestId}/venue/${venue.id}`}
      className={`bg-white rounded-xl overflow-hidden transition-all duration-300 group block ${borderClass}`}
    >
      <div className="relative h-56 w-full overflow-hidden">
        {venue.images && venue.images.length > 0 ? (
          <Image
            src={venue.images[0]}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isApproved && (
            <span className="bg-green-600 shadow-sm px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
              Finalized Selection
            </span>
          )}
          {isCart && (
            <span className="bg-blue-600 shadow-sm px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
              In Consideration
            </span>
          )}
          {!isApproved && !isCart && (
            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-gray-900 uppercase tracking-wider shadow-sm">
              Agent Recommended
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {venue.name}
        </h3>
        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5 font-medium">
          <svg
            className="w-3.5 h-3.5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {venue.location}
        </p>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {venue.description}
        </p>

        <div className="border-t border-gray-50 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {venue.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="px-2.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-semibold rounded-md"
              >
                {amenity}
              </span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="px-2.5 py-0.5 text-gray-400 text-[10px] font-medium">
                +{venue.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
