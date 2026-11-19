# Map Routing & Road-Aligned Path Implementation Guide

> **Authoritative Engineering Specification for Geospatial Routing, Road-Network Snapping, and Multi-Modal Polyline Visualization.**
> 
> *Reference Repository: [DhakaPath](https://github.com/FazleRabbiMugdho/DhakaPath)*  
> *Primary Source Files:*
> - [`src/data/dhakaRoadNetwork.ts`](file:///f:/Hackaton/DhakaPath/src/data/dhakaRoadNetwork.ts) — Road routing engine, coordinate normalization, distance calculations, and multi-leg transfer snapping.
> - [`src/data/dhakaRoadNetwork.json`](file:///f:/Hackaton/DhakaPath/src/data/dhakaRoadNetwork.json) — Precomputed dense road geometries for all hub pairs.
> - [`src/contracts/canonicalGraph.ts`](file:///f:/Hackaton/DhakaPath/src/contracts/canonicalGraph.ts) — Road-snapped hub coordinates (`CANONICAL_HUBS`).
> - [`src/ui/map/AppMap.tsx`](file:///f:/Hackaton/DhakaPath/src/ui/map/AppMap.tsx) — Multi-layered Leaflet rendering, continuous white underlay casing, and interactive pins.

---

## 1. Executive Summary

When building map routing applications (similar to Google Maps, Apple Maps, or Uber), developers and AI assistants often make a critical mistake: **they generate routes using mathematical approximations** (such as straight lines, Bezier curves, or naive midpoint division). 

In real-world urban environments, mathematical approximations **always fail** because:
1. They cut across buildings, residential blocks, water bodies, and parks.
2. They do not follow the actual curves, roundabouts, overpasses, and intersections of physical roads.
3. At transit transfers (e.g., swapping from a bus to a train), mathematical approximations leave visible gaps or create unnatural diagonal jumps.

This specification documents the **exact architecture, mathematical formulas, and coordinate normalization pipelines** implemented in DhakaPath to achieve **100% road-following accuracy with 0.0-meter transfer gaps**.

---

## 2. Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CANONICAL HUBS & STOPS                          │
│   All coordinates snapped to nearest drivable road node (<10m offset)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ROAD-ROUTING ENGINE                             │
│   • Precomputed High-Density OSRM Corridors (JSON Table)               │
│   • Fallback to Live OSRM Driving Engine API                           │
│   • Dense Viaduct Polyline for Elevated Transit (MRT-6)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     COORDINATE NORMALIZATION PIPELINE                  │
│   • GeoJSON [lng, lat]  ──►  Map SDK [lat, lng]                        │
│   • Microdegree Rounding (6 decimal places ≈ 0.11m precision)          │
│   • Consecutive Duplicate Pruning                                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     0.0-METER CONTINUITY ENGINE                        │
│   • Sidewalk & Station Concourse Connectors (Platform ◄──► Curb)       │
│   • ensureContinuousRouteLegs() Snapping                               │
│   • Exact End-to-Start Anchoring: leg[i].end === leg[i+1].start        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         LEAFLET RENDERING                              │
│   • Layer 1: Seamless White Underlay Casing (weight: 11, opacity: 0.95)│
│   • Layer 2: Colored Mode-Specific Polyline (weight: 6-7, solid/dash)  │
│   • Layer 3: Interactive SVG Hub Pins & Contextual Popups              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 5 Inviolable Laws of Accurate Routing

### Law 1: Road-Network Geometry Over Mathematical Interpolation
* **Never** use Bezier curves, quadratic curves, or straight diagonal lines between distant points.
* **Always** extract the complete road-following sequence of coordinates from a routing engine (e.g. OSRM, GraphHopper, Valhalla, or OpenStreetMap highway ways).
* Keep intermediate node spacing under $250\text{m}$ to preserve highway curves, cloverleaf interchanges, and roundabouts.

### Law 2: Strict Coordinate Reference System (CRS) & Ordering
Coordinate confusion is the #1 cause of map bugs:
* **GeoJSON Standard:** `[longitude, latitude]` (used by OSRM, Mapbox APIs, and spatial databases).
* **Map SDK Standard:** `[latitude, longitude]` (used by Leaflet, Google Maps JS, and Apple MapKit).
* **Law:** Never assume an array format without checking. Convert immediately upon API ingestion:
  ```typescript
  // Ingest from OSRM GeoJSON -> Convert to Leaflet LatLng
  const roadCoords: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]) => [+lat.toFixed(6), +lng.toFixed(6)]
  );
  ```

### Law 3: Road-Network Snapping for Landmarks & Hubs
Pins placed visually on satellite imagery often land on rooftops or inside narrow pedestrian courtyards.
* If a pin is off the road, the routing engine forces the vehicle to turn into narrow residential back-alleys to reach the marker.
* **Solution:** Always run hub coordinates through the `/nearest` API:
  ```typescript
  const snapUrl = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`;
  // Ensure distance to nearest drivable road is < 15 meters.
  ```
* In DhakaPath, all 15 hubs were adjusted to exact arterial curb coordinates (e.g., `H_UTTARA` was relocated from a residential alley in Sector 11 `[23.8759, 90.3795]` to the Avenue 2 station concourse `[23.869670, 90.367630]`).

### Law 4: The 0.0-Meter Transfer Continuity Law
In multi-leg journeys (e.g., Bus $\to$ Metro $\to$ Rickshaw), adjacent legs often originate from different physical locations (an elevated train platform vs. a street bus stop).
* Rendering these legs independently results in visible gaps or floating lines.
* **Solution:**
  1. Use ground-truth walking paths (`METRO_HUB_CONNECTORS`) connecting elevated platforms to surface curbs.
  2. Implement an automated snapping pass on multi-leg routes:
  ```typescript
  export function ensureContinuousRouteLegs<T extends { pts: [number, number][] }>(legs: T[]): T[] {
    for (let i = 0; i < legs.length - 1; i++) {
      const cur = legs[i];
      const nxt = legs[i + 1];
      if (cur.pts.length === 0 || nxt.pts.length === 0) continue;
      
      const endOfCur = cur.pts[cur.pts.length - 1];
      const startOfNxt = nxt.pts[0];
      
      // Snap both endpoints to their shared junction coordinate
      if (endOfCur[0] !== startOfNxt[0] || endOfCur[1] !== startOfNxt[1]) {
        nxt.pts[0] = [endOfCur[0], endOfCur[1]];
      }
    }
    return legs;
  }
  ```

### Law 5: Polyline Directional Integrity (Reverse Segment Detection)
When concatenating polylines from CSV datasets or separate road ways:
* Raw data rows may be digitized in opposite directions (e.g., East $\to$ West instead of West $\to$ East).
* Naively appending a reversed segment creates a massive diagonal line cutting back across the city.
* **Verification Algorithm:**
  ```typescript
  function stitchSegments(segments: [number, number][][]): [number, number][] {
    const result = [...segments[0]];
    for (let i = 1; i < segments.length; i++) {
      const prevEnd = result[result.length - 1];
      const seg = segments[i];
      const distNormal = haversine(prevEnd, seg[0]);
      const distFlipped = haversine(prevEnd, seg[seg.length - 1]);
      
      // If the tail is closer than the head, the segment is backwards!
      const oriented = distFlipped < distNormal ? [...seg].reverse() : seg;
      result.push(...oriented);
    }
    return result;
  }
  ```

---

## 4. Visual Rendering: The Professional Casing Technique

To make multiple legs appear as one cohesive, continuous Google Maps-style route:
Render a **dual-stroke polyline** in Leaflet:
1. **Background Casing:** Render a thick white or light neutral polyline across the entire concatenated route (`fitPoints`).
2. **Foreground Color Stroke:** Render each individual leg polyline on top with its specific mode color.

```tsx
{/* 1. Seamless white underlay casing spanning the entire route */}
{fitPoints.length > 1 && (
  <Polyline
    positions={fitPoints}
    pathOptions={{
      color: "#ffffff",
      weight: 11,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }}
  />
)}

{/* 2. Leg-by-leg mode colored polylines */}
{legs.map(({ leg, pts }) => (
  <Polyline
    key={leg.edge_id}
    positions={pts}
    pathOptions={{
      color: MODE_STYLE[leg.mode].color,
      weight: leg.mode === "METRO" ? 7 : 6,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      dashArray: leg.mode === "WALK" ? "3 6" : undefined,
    }}
  />
))}
```

---

## 5. Master Prompt Template for Future AI Implementation

When starting any new mapping project or asking an AI to implement road-following routes, **share this repository's link** and copy-paste the prompt below:

```markdown
Task: Implement Road-Aligned Route Geometry & Map Visualization

Please review the path-following architecture in the DhakaPath repository:
https://github.com/FazleRabbiMugdho/DhakaPath
Specifically refer to `docs/MAP_AND_ROUTING_IMPLEMENTATION.md` and `src/data/dhakaRoadNetwork.ts`.

Follow this exact methodology for our project:
1. DO NOT mathematically interpolate coordinates with bezier curves or straight lines.
2. Ensure all hub/station coordinates are snapped to the nearest arterial road centerline (<10m offset).
3. Use a road routing engine (OSRM / GraphHopper / Valhalla) to retrieve dense road-following geometries.
4. Correctly convert GeoJSON [longitude, latitude] into Leaflet/Map SDK [latitude, longitude].
5. Guarantee 0.0-meter transfer continuity between consecutive legs using `ensureContinuousRouteLegs()` so that `leg[i].pts.at(-1) === leg[i+1].pts[0]`.
6. Audit polyline segment directions before concatenating to detect and reverse any backwards CSV/API segments.
7. Render a dual-stroke polyline (white casing underlay of width 11px + colored foreground stroke of width 6px) for a seamless, continuous aesthetic.
```
