'use client'

import { useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const cities = ['Berlin', 'Paris', 'Tokyo', 'New York']

const haversineDistance = (lat1, lon1, lat2, lon2, unit = 'km') => {
  const R = unit === 'km' ? 6371 : 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function DistanceCalculator() {
  const [fromCity, setFromCity] = useState(cities[0])
  const [toCity, setToCity] = useState(cities[1])
  const [unit, setUnit] = useState('km')
  const [distance, setDistance] = useState(null)
  const [history, setHistory] = useState([]) // last 5 calculations

  const fetchCoordinates = async (city) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${city}&format=json`)
      const data = response.data[0]
      return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) }
    } catch (error) {
      console.error('Error fetching coordinates:', error)
      return null
    }
  }

  const calculateDistance = async () => {
    let distValue = null
    if (fromCity === toCity) {
      distValue = 0
      setDistance(distValue)
    } else {
      const fromCoords = await fetchCoordinates(fromCity)
      const toCoords = await fetchCoordinates(toCity)
      if (fromCoords && toCoords) {
        distValue = haversineDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon, unit).toFixed(2)
        setDistance(distValue)
      } else {
        distValue = 'Error fetching coordinates'
        setDistance(distValue)
      }
    }

    // Update history (keep only last 5)
    setHistory(prev => {
      const newEntry = { fromCity, toCity, unit, distance: distValue }
      const updated = [newEntry, ...prev]
      return updated.slice(0, 5)
    })
  }

  const exportPDFHistory = () => {
    if (history.length === 0) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    doc.text('Last 5 City Distance Calculations', 40, 40)

    autoTable(doc, {
      head: [['From City', 'To City', 'Unit', 'Distance']],
      body: history.map(h => [h.fromCity, h.toCity, h.unit, h.distance + ' ' + h.unit]),
      startY: 60,
      styles: { fontSize: 14, cellPadding: 10, textColor: [0, 0, 0] }, // black text
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }, // header white bg, black text
      margin: { left: 40, right: 40 },
      theme: 'grid'
    })

    doc.save('last_5_distances.pdf')
  }

  return (
    <div style={{
      backgroundColor: '#BBE0FF', // baby blue
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center', color: '#000' }}>
        City Distance Calculator
      </h1>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
            From City
          </label>
          <select
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
              backgroundColor: '#fff',
              color: '#000'
            }}
          >
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
            To City
          </label>
          <select
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
              backgroundColor: '#fff',
              color: '#000'
            }}
          >
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
              backgroundColor: '#fff',
              color: '#000'
            }}
          >
            <option value="km">Kilometers</option>
            <option value="miles">Miles</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={calculateDistance}
          style={{
            width: '100%',
            backgroundColor: '#3B82F6',
            color: '#fff',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Calculate Distance
        </button>

        {distance && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#000' }}>Distance: {distance} {unit}</p>
          </div>
        )}

        <button
          onClick={exportPDFHistory}
          style={{
            width: '100%',
            backgroundColor: '#10B981',
            color: '#fff',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Export Last 5 Calculations
        </button>
      </div>
    </div>
  )
}
