"use client"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import type { DiscoveryBox } from "@/components/boxCard"

const pin = L.divIcon({
  className: "",
  html: '<div style="background:#CE5228;width:14px;height:14px;border-radius:50%;border:2px solid white"></div>',
  iconSize: [14, 14],
})

export default function DiscoveryMap({ boxes, center }: { boxes: DiscoveryBox[]; center: { lat: number; lng: number } }) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-[70vh] w-full rounded-xl ring-1 ring-pino/15">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      {boxes.map((b) => (
        <Marker key={b.id} position={[b.lat, b.lng]} icon={pin}>
          <Popup>
            <a href={`/box/${b.id}`} className="font-medium">{b.title}</a><br />
            {b.storeName} · ${b.price}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
