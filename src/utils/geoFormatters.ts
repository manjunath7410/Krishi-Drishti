/**
 * Geographic and GPS coordinate formatting & land calculation utilities
 * Formats coordinates into standard geographical representations with N/S and E/W cardinal direction indicators.
 * Includes precise Geodetic Area, Multi-unit conversions (Acre, Guntha, Bigha, Ha, Cents),
 * Perimeter & Edge distances, Douglas-Peucker simplification, and Multi-sample GPS averaging.
 */

export function formatCoord(val: number, type: 'lat' | 'lng', precision = 4): string {
  if (isNaN(val) || val === null || val === undefined) return '--';
  const abs = Math.abs(val).toFixed(precision);
  if (type === 'lat') {
    return `${abs}°${val >= 0 ? 'N' : 'S'}`;
  } else {
    return `${abs}°${val >= 0 ? 'E' : 'W'}`;
  }
}

export function formatCoordinatePair(lat: number, lng: number, precision = 4): string {
  if (isNaN(lat) || isNaN(lng)) return '--';
  return `${formatCoord(lat, 'lat', precision)}, ${formatCoord(lng, 'lng', precision)}`;
}

/**
 * Calculates Haversine distance in meters between two lat/lng pairs
 */
export function calculateDistanceMeters(p1: [number, number], p2: [number, number]): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (p2[0] - p1[0]) * (Math.PI / 180);
  const dLon = (p2[1] - p1[1]) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1[0] * (Math.PI / 180)) *
      Math.cos(p2[0] * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates compass initial bearing in degrees from p1 to p2 (0 - 360)
 */
export function calculateBearing(p1: [number, number], p2: [number, number]): number {
  const lat1 = p1[0] * (Math.PI / 180);
  const lat2 = p2[0] * (Math.PI / 180);
  const dLon = (p2[1] - p1[1]) * (Math.PI / 180);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return directions[Math.round(bearing / 45) % 8];
}

/**
 * Calculates precise geodesic polygon area on WGS84 sphere in square meters
 */
export function calculatePolygonAreaSqM(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const d2r = Math.PI / 180;
  let area = 0.0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];
    area += (p2[1] * d2r - p1[1] * d2r) * (2 + Math.sin(p1[0] * d2r) + Math.sin(p2[0] * d2r));
  }
  area = (area * 6378137.0 * 6378137.0) / 2.0;
  return Math.abs(area);
}

/**
 * Calculates polygon perimeter in meters
 */
export function calculatePerimeterMeters(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const nextIdx = (i + 1) % coords.length;
    // For unclosed paths in tracking vs closed polygons
    perimeter += calculateDistanceMeters(coords[i], coords[nextIdx]);
  }
  return perimeter;
}

export interface EdgeDetail {
  fromIdx: number;
  toIdx: number;
  distanceMeters: number;
  distanceFeet: number;
  bearing: number;
  cardinal: string;
  midpoint: [number, number];
}

/**
 * Calculates individual edge distances, bearings, and midpoints for all polygon sides
 */
export function calculateEdges(coords: [number, number][]): EdgeDetail[] {
  if (coords.length < 2) return [];
  const edges: EdgeDetail[] = [];
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];
    const dist = calculateDistanceMeters(p1, p2);
    const bearing = calculateBearing(p1, p2);
    edges.push({
      fromIdx: i,
      toIdx: j,
      distanceMeters: dist,
      distanceFeet: dist * 3.28084,
      bearing,
      cardinal: getCardinalDirection(bearing),
      midpoint: [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
    });
  }
  return edges;
}

export interface AreaConversions {
  sqMeters: number;
  sqFeet: number;
  hectares: number;
  acres: number;
  guntha: number;      // 1 Acre = 40 Guntha (Standard in Maharashtra, Karnataka, Gujarat)
  bigha: number;       // 1 Acre ≈ 1.6 Bigha (Standard Central/Northern India ~2500 sq m)
  cents: number;       // 1 Acre = 100 Cents (South India)
}

export function convertArea(sqMeters: number): AreaConversions {
  const sqFeet = sqMeters * 10.7639;
  const hectares = sqMeters / 10000;
  const acres = sqMeters * 0.000247105;
  const guntha = acres * 40;
  const bigha = acres * 1.6133;
  const cents = acres * 100;

  return {
    sqMeters,
    sqFeet,
    hectares,
    acres,
    guntha,
    bigha,
    cents
  };
}

/**
 * Douglas-Peucker algorithm to simplify continuous walk GPS trails into clean polygon corners
 */
export function simplifyDouglasPeucker(points: [number, number][], toleranceMeters = 3.0): [number, number][] {
  if (points.length <= 3) return points;

  // Find point with maximum distance from line segment between first and last
  let maxDist = 0;
  let maxIndex = 0;
  const pStart = points[0];
  const pEnd = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistanceMeters(points[i], pStart, pEnd);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > toleranceMeters) {
    const left = simplifyDouglasPeucker(points.slice(0, maxIndex + 1), toleranceMeters);
    const right = simplifyDouglasPeucker(points.slice(maxIndex), toleranceMeters);
    return left.slice(0, -1).concat(right);
  } else {
    return [pStart, pEnd];
  }
}

function perpendicularDistanceMeters(p: [number, number], p1: [number, number], p2: [number, number]): number {
  const lineDist = calculateDistanceMeters(p1, p2);
  if (lineDist === 0) return calculateDistanceMeters(p, p1);

  // Area of triangle using Heron's formula / cross product approximation
  const d1 = calculateDistanceMeters(p, p1);
  const d2 = calculateDistanceMeters(p, p2);
  const s = (d1 + d2 + lineDist) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - d1) * (s - d2) * (s - lineDist)));
  return (2 * area) / lineDist;
}

/**
 * Computes statistical median / outlier-filtered average from multiple GPS samples
 */
export function computeGpsAverage(samples: { lat: number; lng: number; accuracy: number }[]): {
  lat: number;
  lng: number;
  avgAccuracy: number;
  sampleCount: number;
} {
  if (samples.length === 0) {
    return { lat: 0, lng: 0, avgAccuracy: 0, sampleCount: 0 };
  }
  if (samples.length === 1) {
    return {
      lat: samples[0].lat,
      lng: samples[0].lng,
      avgAccuracy: samples[0].accuracy,
      sampleCount: 1
    };
  }

  // Weight by inverse of accuracy (higher accuracy / lower meters gets higher weight)
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  let sumAcc = 0;

  for (const s of samples) {
    const weight = 1 / Math.max(0.5, s.accuracy);
    weightedLat += s.lat * weight;
    weightedLng += s.lng * weight;
    totalWeight += weight;
    sumAcc += s.accuracy;
  }

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
    avgAccuracy: sumAcc / samples.length,
    sampleCount: samples.length
  };
}

/**
 * Generate standard GeoJSON representation of marked plot
 */
export function exportToGeoJSON(name: string, coordinates: [number, number][], areaAcres: number) {
  const geoJsonCoords = coordinates.map(c => [c[1], c[0]]);
  if (geoJsonCoords.length > 0) {
    // Close polygon loop in GeoJSON specification
    geoJsonCoords.push([coordinates[0][1], coordinates[0][0]]);
  }

  const data = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name,
          area_acres: Number(areaAcres.toFixed(3)),
          generated_by: "Krishi-Drishti Precision Land Boundary Suite",
          timestamp: new Date().toISOString()
        },
        geometry: {
          type: "Polygon",
          coordinates: [geoJsonCoords]
        }
      }
    ]
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Generate KML format representation (Google Earth / Farm GIS standard)
 */
export function exportToKML(name: string, coordinates: [number, number][], areaAcres: number): string {
  const kmlCoords = coordinates
    .map(c => `${c[1]},${c[0]},0`)
    .concat(coordinates.length > 0 ? [`${coordinates[0][1]},${coordinates[0][0]},0`] : [])
    .join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>
    <description>Marked Farm Boundary (${areaAcres.toFixed(2)} Acres) via Krishi-Drishti</description>
    <Style id="farmPoly">
      <LineStyle>
        <color>ff00aa00</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff55</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${name}</name>
      <styleUrl>#farmPoly</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${kmlCoords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
}
