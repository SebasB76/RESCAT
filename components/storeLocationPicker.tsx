"use client"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

type LatLng = { lat: number; lng: number }

const pin = L.divIcon({
  className: "",
  html: '<div style="background:#CE5228;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function Picker({ value, onChange }: { value: LatLng; onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) },
  })
  return (
    <Marker
      position={[value.lat, value.lng]}
      icon={pin}
      draggable
      eventHandlers={{
        dragend(e) {
          const p = (e.target as L.Marker).getLatLng()
          onChange({ lat: p.lat, lng: p.lng })
        },
      }}
    />
  )
}

export default function StoreLocationPicker({ value, onChange }: { value: LatLng; onChange: (v: LatLng) => void }) {
  return (
    <MapContainer center={[value.lat, value.lng]} zoom={13} className="h-64 w-full rounded-xl">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      <Picker value={value} onChange={onChange} />
    </MapContainer>
  )
}
