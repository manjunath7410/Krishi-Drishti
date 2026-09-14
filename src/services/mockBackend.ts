/**
 * In-Memory Mock Backend for Krishi-Drishti
 * Provides complete data services for authentication, user profiles, weather,
 * satellite monitoring, market listings, carbon offset programs, community,
 * smart contracts, traceability tokens, and admin dashboard.
 */

export interface MockStorage {
  user: any;
  plots: any[];
  listings: any[];
  schemes: any[];
  communityPosts: any[];
  carbonProjects: any[];
  tokens: any[];
  contracts: any[];
  insuranceProducts: any[];
  cropCycles: Record<number, any[]>;
}

// Initial state loaded from localStorage or defaults
const STORAGE_KEY = 'kd_mock_storage_v1';

const defaultStorage: MockStorage = {
  user: {
    id: 1,
    phone: "9876543210",
    name: "Ramesh Patil",
    district: "Nagpur",
    state: "Maharashtra",
    land_size: 2.5,
    category: "General",
    crops: ["Wheat", "Cotton", "Orange"],
    soil_type: "Black Cotton Soil",
    is_verified: true,
    trust_score: 94,
    created_at: "2026-01-15T08:00:00Z"
  },
  plots: [
    {
      id: 1,
      name: "North Field - Cotton",
      coordinates: [
        { lat: 21.1460, lng: 79.0890 },
        { lat: 21.1472, lng: 79.0890 },
        { lat: 21.1472, lng: 79.0905 },
        { lat: 21.1460, lng: 79.0905 }
      ],
      area: 2.5,
      crop_type: "Cotton",
      health_score: 0.92,
      moisture: 35.0,
      created_at: "2026-02-01T10:00:00Z",
      image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
      last_scan_date: "2026-02-12T06:00:00Z"
    },
    {
      id: 2,
      name: "South Orchard - Orange",
      coordinates: [
        { lat: 21.1440, lng: 79.0880 },
        { lat: 21.1455, lng: 79.0880 },
        { lat: 21.1455, lng: 79.0895 },
        { lat: 21.1440, lng: 79.0895 }
      ],
      area: 4.0,
      crop_type: "Orange",
      health_score: 0.81,
      moisture: 28.0,
      created_at: "2026-01-20T10:00:00Z",
      image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800",
      last_scan_date: "2026-02-11T12:00:00Z"
    }
  ],
  listings: [
    {
      id: 1,
      crop_name: "Premium Organic Wheat",
      quantity: "500kg",
      price: "₹3,200/quintal",
      location: "Nagpur Mandi",
      description: "High quality Sharbati wheat, 100% pesticide and chemical free.",
      is_organic: true,
      grade: "A",
      trend: "up",
      seller_name: "Ramesh Patil",
      image_url: "https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?w=1000&q=80"
    },
    {
      id: 2,
      crop_name: "Red Onions",
      quantity: "2000kg",
      price: "₹18/kg",
      location: "Nashik Mandi",
      description: "Fresh harvest, dried in shade, superior bulb size.",
      is_organic: false,
      grade: "A",
      trend: "stable",
      seller_name: "Sita Devi",
      image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=1000&q=80"
    },
    {
      id: 3,
      crop_name: "Cleaned Soybean",
      quantity: "1000kg",
      price: "₹4,800/quintal",
      location: "Amravati Mandi",
      description: "Mechanically cleaned and graded soybean, high oil content.",
      is_organic: false,
      grade: "A",
      trend: "up",
      seller_name: "Amit Singh",
      image_url: "https://images.unsplash.com/photo-1595855709915-37b42028678d?w=800"
    },
    {
      id: 4,
      crop_name: "Nagpur Sweet Oranges",
      quantity: "1500kg",
      price: "₹55/kg",
      location: "Nagpur Mandi",
      description: "Export grade organic oranges, direct from tree to mandi.",
      is_organic: true,
      grade: "A+",
      trend: "up",
      seller_name: "Ramesh Patil",
      image_url: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1000&q=80"
    }
  ],
  schemes: [
    {
      id: 1,
      title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      description: "Comprehensive crop insurance coverage against unforeseen weather events, pests, and natural calamities.",
      tag: "NEW",
      deadline: "Aug 30, 2026",
      benefits: "Up to 100% financial compensation for yield loss.",
      eligibility: "All farmers growing notified crops in notified areas.",
      link: "https://pmfby.gov.in/"
    },
    {
      id: 2,
      title: "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
      description: "Aims to expand cultivable area under assured irrigation and improve on-farm water efficiency.",
      tag: "SUBSIDY",
      deadline: "July 15, 2026",
      benefits: "Subsidy up to 55% for Drip and Sprinkler irrigation systems.",
      eligibility: "Land-holding title or registered lease required.",
      link: "https://pmksy.gov.in/"
    },
    {
      id: 3,
      title: "Paramparagat Krishi Vikas Yojana (PKVY)",
      description: "Promotes organic farming through cluster-based approaches and PGS-India certification.",
      tag: "URGENT",
      deadline: "Rolling",
      benefits: "Financial assistance of ₹50,000 per hectare over 3 years.",
      eligibility: "Cluster of 20 or more farmers required.",
      link: "https://pgsindia-ncof.gov.in/"
    },
    {
      id: 4,
      title: "PM-KUSUM Solar Agricultural Pump Scheme",
      description: "Subsidized standalone solar-powered agriculture pumps for reliable daytime irrigation.",
      tag: "POPULAR",
      deadline: "Dec 31, 2026",
      benefits: "60% government subsidy (30% central + 30% state) + 30% bank loan.",
      eligibility: "Farmers with agricultural electricity connection or diesel pump.",
      link: "https://pmkusum.mnre.gov.in/"
    }
  ],
  communityPosts: [
    {
      id: 1,
      user_name: "Ramesh Patil",
      user_id: 1,
      content: "Great harvest this season! My organic wheat crop has minimal pest stress thanks to companion planting with mustard.",
      image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
      likes_count: 34,
      created_at: "2 hours ago",
      comments: [
        { id: 1, user_name: "Sita Devi", text: "Congratulations Ramesh ji! Which organic pesticide did you spray?", created_at: "1 hour ago" },
        { id: 2, user_name: "Ramesh Patil", text: "Used Dashparni ark and neem oil 10000 ppm every 14 days.", created_at: "45 mins ago" }
      ]
    },
    {
      id: 2,
      user_name: "Sita Devi",
      user_id: 2,
      content: "Quick tip for Nashik and Vidarbha farmers: mulching with dry crop residue is retaining up to 40% more soil moisture in high afternoon heat!",
      image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800",
      likes_count: 142,
      created_at: "5 hours ago",
      comments: [
        { id: 3, user_name: "Amit Singh", text: "Very true, also prevents weed growth effectively.", created_at: "3 hours ago" }
      ]
    },
    {
      id: 3,
      user_name: "Amit Singh",
      user_id: 3,
      content: "Just enrolled our Amravati cluster into the Soil Carbon Offset program on Krishi-Drishti. Already verified 45 credits!",
      image_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
      likes_count: 88,
      created_at: "1 day ago",
      comments: []
    }
  ],
  carbonProjects: [
    {
      id: 101,
      plot_id: 1,
      plot_name: "North Field - Cotton",
      methodology: "Cover-Crop",
      aggregator_name: "Verra Core",
      status: "Enrolled",
      projected_credits: 45.5,
      available_credits: 14.0,
      locked_credits: 8.0,
      verified_credits: 23.5,
      government_scheme: "National Mission for Sustainable Agriculture",
      platform_fee_percentage: 5,
      farmer_share_percentage: 95,
      start_date: "2026-01-01T00:00:00Z",
      vesting_end_date: "2026-12-31T00:00:00Z",
      verification_cost_usd: 120,
      buffer_pool_percentage: 10
    },
    {
      id: 102,
      plot_id: 2,
      plot_name: "South Orchard - Orange",
      methodology: "Biochar Application",
      aggregator_name: "Puro Earth",
      status: "Verified",
      projected_credits: 72.0,
      available_credits: 28.0,
      locked_credits: 12.0,
      verified_credits: 32.0,
      government_scheme: "PKVY Soil Carbon Credit Initiative",
      platform_fee_percentage: 6,
      farmer_share_percentage: 94,
      start_date: "2025-11-15T00:00:00Z",
      vesting_end_date: "2026-11-15T00:00:00Z",
      verification_cost_usd: 150,
      buffer_pool_percentage: 10
    }
  ],
  tokens: [
    {
      id: "TRC-7410",
      crop: "Organic Sharbati Wheat",
      variety: "Sharbati Gold",
      quantity_kg: 500,
      harvest_date: "2026-02-05",
      location: "Nagpur, Maharashtra",
      status: "Minted",
      carbon_footprint_kg_co2e: 105.0,
      mint_date: "2026-02-08T09:30:00Z",
      verified: true,
      token_id: "TRC-7410",
      blockchain_tx: "0x8f3c4e92a10b8d7e6c4b2a19f8e7d5c3b1a09876",
      farmer_name: "Ramesh Patil"
    },
    {
      id: "TRC-8921",
      crop: "Nagpur Oranges",
      variety: "Kinnow / Nagpur Hybrid",
      quantity_kg: 1200,
      harvest_date: "2026-01-28",
      location: "Nagpur, Maharashtra",
      status: "Verified",
      carbon_footprint_kg_co2e: 180.0,
      mint_date: "2026-02-01T14:15:00Z",
      verified: true,
      token_id: "TRC-8921",
      blockchain_tx: "0x2b4c6e8a0f1d3c5e7a9b1d3f5e7c9a1b3d5f7e9a",
      farmer_name: "Ramesh Patil"
    }
  ],
  contracts: [
    {
      id: 201,
      title: "Direct Sourcing - Organic Sharbati Wheat",
      buyer_name: "Reliance Fresh Retail Ltd.",
      crop: "Wheat",
      quantity: "500kg",
      offered_price: "₹3,400/quintal",
      delivery_date: "2026-03-15",
      status: "Open",
      terms: "Moisture content under 12%, A-grade grain certification provided by Krishi-Drishti QA.",
      created_at: "2026-02-10"
    },
    {
      id: 202,
      title: "Export Contract - Grade A Nagpur Oranges",
      buyer_name: "Zomato Hyperpure & Agro Export",
      crop: "Orange",
      quantity: "1500kg",
      offered_price: "₹58/kg",
      delivery_date: "2026-02-28",
      status: "Signed",
      terms: "Direct packhouse dispatch from farm gate. Advance 40% cleared to escrow.",
      created_at: "2026-02-02"
    }
  ],
  insuranceProducts: [
    {
      id: "ins-1",
      name: "PM Fasal Bima Comprehensive Shield",
      type: "Yield-Based Indemnity",
      premium_inr: "₹420/acre",
      sum_insured: "₹28,000/acre",
      insurer: "Agriculture Insurance Company of India",
      payout_trigger: "Block yield drops below 80% threshold",
      rating: 4.8
    },
    {
      id: "ins-2",
      name: "Satellite Weather Index Parametric Cover",
      type: "Automated Parametric",
      premium_inr: "₹350/acre",
      sum_insured: "₹20,000/acre",
      insurer: "ICICI Lombard Crop Shield",
      payout_trigger: "Rainfall deficit > 40% or Heat wave > 42°C for 5 days",
      rating: 4.9
    },
    {
      id: "ins-3",
      name: "Biological Pest & Fungal Risk Protection",
      type: "AI Diagnostic Index",
      premium_inr: "₹280/acre",
      sum_insured: "₹15,000/acre",
      insurer: "HDFC ERGO General Insurance",
      payout_trigger: "Verified satellite vegetative drop accompanied by Krishi-Drishti vision scan",
      rating: 4.7
    }
  ],
  cropCycles: {
    1: [
      {
        id: 301,
        plot_id: 1,
        crop_type: "Cotton",
        variety: "Bt Hybrid",
        stage: "Boll Formation / Flowering",
        sowing_date: "2025-10-15",
        expected_harvest: "2026-03-20",
        events: [
          { id: 1, type: "Sowing", date: "2025-10-15", notes: "Seed treatment with Trichoderma viride completed." },
          { id: 2, type: "Fertilizer", date: "2025-11-20", notes: "Application of FYM + 25kg Vermicompost per bed." },
          { id: 3, type: "Irrigation", date: "2026-01-10", notes: "Drip irrigation cycle: 4 hours at 2.2 bar pressure." }
        ]
      }
    ]
  }
};

function getStorage(): MockStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read mock storage from localStorage", e);
  }
  return defaultStorage;
}

function saveStorage(storage: MockStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.warn("Could not save mock storage to localStorage", e);
  }
}

/**
 * Handles mock API requests and returns formatted response objects
 */
export async function handleMockApi(config: any): Promise<{ data: any; status: number; statusText: string; headers: any }> {
  const url: string = config.url || '';
  const method: string = (config.method || 'GET').toUpperCase();
  const storage = getStorage();

  // Parse path without query
  const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '');
  const urlObj = new URL(url.startsWith('http') ? url : `http://mock.local${url.startsWith('/') ? '' : '/'}${url}`);
  const pathname = urlObj.pathname.replace(/^\/api/, '');
  const params = urlObj.searchParams;

  console.log(`[MockBackend] ${method} ${pathname}`, config.data || config.params);

  // 1. Auth: Send OTP
  if (pathname === '/auth/send-otp' && method === 'POST') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const phone = body.phone || '9876543210';
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        success: true,
        message: `OTP sent to ${phone}. Your verification code is 1234.`
      }
    };
  }

  // 2. Auth: Verify OTP
  if (pathname === '/auth/verify-otp' && method === 'POST') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const phone = body.phone || storage.user.phone;
    const token = `kd_token_farmer_${Date.now()}`;
    storage.user.phone = phone;
    saveStorage(storage);
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        access_token: token,
        token_type: 'bearer',
        user: storage.user
      }
    };
  }

  // 3. User Profile
  if (pathname === '/users/me') {
    if (method === 'GET') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: storage.user
      };
    }
    if (method === 'PUT') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
      storage.user = { ...storage.user, ...body };
      saveStorage(storage);
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: storage.user
      };
    }
  }

  // 4. Weather: Current
  if (pathname === '/weather/current') {
    const lat = parseFloat(params.get('lat') || config.params?.lat || '21.1458');
    const lng = parseFloat(params.get('lng') || config.params?.lng || '79.0882');

    try {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,precipitation,weather_code,is_day,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,visibility,uv_index,dew_point_2m,soil_temperature_0cm&hourly=temperature_2m,weather_code,precipitation_probability,apparent_temperature,wind_speed_10m,visibility,is_day,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=10`;
      const res = await fetch(openMeteoUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data
        };
      }
    } catch (e) {
      console.warn("[MockBackend] Direct Open-Meteo fetch failed, using realistic fallback", e);
    }

    // Fallback realistic weather object
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: generateFallbackWeather(lat, lng)
    };
  }

  // Weather: Air Quality
  if (pathname === '/weather/airquality') {
    const lat = parseFloat(params.get('lat') || config.params?.lat || '21.1458');
    const lng = parseFloat(params.get('lng') || config.params?.lng || '79.0882');
    try {
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi,dust,uv_index&hourly=pm2_5,us_aqi&timezone=auto`;
      const res = await fetch(aqUrl);
      if (res.ok) {
        const data = await res.json();
        const aqi = data?.current?.us_aqi || 45;
        const pm25 = data?.current?.pm2_5 || 12.4;
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: {
            aqi: Math.round(aqi),
            pm2_5: Number(pm25.toFixed(1)),
            pm10: Number((data?.current?.pm10 || 28.0).toFixed(1)),
            label: aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy',
            color: aqi <= 50 ? '#4ade80' : aqi <= 100 ? '#facc15' : '#fb923c',
            raw: data?.current || {}
          }
        };
      }
    } catch { /* ignore */ }

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { aqi: 48, pm2_5: 14.2, pm10: 28.5, label: "Good", color: "#4ade80", raw: {} }
    };
  }

  // Weather: Search city / village / place
  if (pathname === '/weather/search') {
    const rawQuery = (params.get('query') || config.params?.query || '').trim();
    const results: any[] = [];
    const seen = new Set<string>();

    const addResult = (res: { id: any; name: string; country: string; latitude: number; longitude: number }) => {
      const key = `${res.latitude?.toFixed(3)}_${res.longitude?.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(res);
      }
    };

    // 1. Nominatim lookup with address details (excellent for Indian villages, taluks, chatras, and local areas)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(rawQuery)}&countrycodes=in&format=json&addressdetails=1&limit=5`;
      const res = await fetch(nomUrl, { headers: { 'User-Agent': 'KrishiDrishti/1.0' } });
      if (res.ok) {
        const data = await res.json();
        data.forEach((item: any) => {
          const addr = item.address || {};
          const local = item.name || addr.hamlet || addr.village || addr.suburb || addr.town || addr.city;
          const contextParts = [addr.county, addr.state_district, addr.state].filter(Boolean);
          addResult({
            id: item.place_id,
            name: local || rawQuery,
            country: contextParts.join(', ') || item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          });
        });
      }
    } catch { /* ignore */ }

    // 1b. If compound query like "Bidadi Chatra" returned 0 direct hits, search the primary place name and label with the user's specific query
    if (results.length === 0 && rawQuery.includes(' ')) {
      const firstWord = rawQuery.split(' ')[0];
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(firstWord)}&countrycodes=in&format=json&addressdetails=1&limit=3`;
        const res = await fetch(nomUrl, { headers: { 'User-Agent': 'KrishiDrishti/1.0' } });
        if (res.ok) {
          const data = await res.json();
          data.forEach((item: any) => {
            const addr = item.address || {};
            const contextParts = [addr.county, addr.state_district, addr.state].filter(Boolean);
            addResult({
              id: `custom-${item.place_id}`,
              name: rawQuery, // e.g. "Bidadi Chatra"
              country: contextParts.join(', ') || item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon)
            });
          });
        }
      } catch { /* ignore */ }
    }

    // 2. Open-Meteo geocoding search as additional source
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(rawQuery)}&count=5&language=en&format=json`;
      const res = await fetch(geoUrl);
      if (res.ok) {
        const data = await res.json();
        (data.results || []).forEach((r: any) => {
          addResult({
            id: r.id,
            name: r.name,
            country: [r.admin2, r.admin1, r.country].filter(Boolean).join(', '),
            latitude: r.latitude,
            longitude: r.longitude
          });
        });
      }
    } catch { /* ignore */ }

    if (results.length > 0) {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: results
      };
    }

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: [
        { id: 1, name: rawQuery || "Bidadi", country: "Karnataka, India", latitude: 12.7988, longitude: 77.3870 },
        { id: 2, name: "Nagpur", country: "Maharashtra, India", latitude: 21.1458, longitude: 79.0882 },
        { id: 3, name: "Pune", country: "Maharashtra, India", latitude: 18.5204, longitude: 73.8567 }
      ]
    };
  }

  // Weather: Reverse Geocode
  if (pathname === '/weather/reverse') {
    const lat = parseFloat(params.get('lat') || config.params?.lat || '21.1458');
    const lng = parseFloat(params.get('lng') || config.params?.lng || '79.0882');

    // 1. Primary: Nominatim reverse geocode (provides exact village, town, taluk names in India)
    try {
      const nomRevUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`;
      const res = await fetch(nomRevUrl, { headers: { 'User-Agent': 'KrishiDrishti/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const local = addr.hamlet || addr.suburb || addr.village || addr.neighbourhood || addr.road || addr.residential || addr.town || addr.city_district || addr.city;
        const talukOrDistrict = addr.county || addr.state_district || addr.district;
        const state = addr.state || '';

        if (local || talukOrDistrict) {
          const placeName = local || talukOrDistrict;
          const districtClean = (talukOrDistrict || state || 'India').replace(/ taluk/i, '').replace(/ district/i, '');
          const formatted = [placeName, talukOrDistrict && talukOrDistrict !== placeName ? talukOrDistrict : '', state].filter(Boolean).join(', ');

          return {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            data: {
              city: placeName,
              district: districtClean,
              formatted: formatted || placeName
            }
          };
        }
      }
    } catch { /* continue to BigDataCloud */ }

    // 2. Secondary: BigDataCloud reverse geocode client
    try {
      const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(revUrl);
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.city || '';
        const state = data.principalSubdivision || '';
        const adminLevels = data.localityInfo?.administrative || [];
        const districtObj = adminLevels.find((a: any) => a.adminLevel === 5 || (a.description && a.description.toLowerCase().includes('district')));
        const districtName = districtObj?.name?.replace(/ district/i, '') || state;
        const cityName = locality || districtName || (Math.abs(lat - 21.1458) < 0.2 && Math.abs(lng - 79.0882) < 0.2 ? 'Nagpur' : `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`);
        const formatted = [cityName, districtName !== cityName ? districtName : '', state].filter(Boolean).join(', ');

        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: {
            city: cityName,
            district: districtName || state || 'India',
            formatted: formatted || cityName
          }
        };
      }
    } catch { /* ignore */ }

    // Fallback based on coordinates
    const isNagpurArea = Math.abs(lat - 21.1458) < 0.2 && Math.abs(lng - 79.0882) < 0.2;
    const isBidadiArea = Math.abs(lat - 12.8) < 0.15 && Math.abs(lng - 77.4) < 0.15;
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        city: isBidadiArea ? "Bidadi Chatra" : isNagpurArea ? "Nagpur" : `Pinpoint Location`,
        district: isBidadiArea ? "Ramanagara, Karnataka" : isNagpurArea ? "Nagpur, Maharashtra" : `Lat ${lat.toFixed(3)}, Lng ${lng.toFixed(3)}`,
        formatted: isBidadiArea ? "Bidadi Chatra, Ramanagara, Karnataka" : isNagpurArea ? "Nagpur, Maharashtra" : `Pinpoint Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`
      }
    };
  }

  // 5. Market Listings
  if (pathname === '/market/' || pathname === '/market') {
    if (method === 'GET') {
      let filtered = [...storage.listings];
      const crop = params.get('crop') || config.params?.crop;
      const loc = params.get('location') || config.params?.location;
      if (crop) filtered = filtered.filter(l => l.crop_name.toLowerCase().includes(crop.toLowerCase()));
      if (loc) filtered = filtered.filter(l => l.location.toLowerCase().includes(loc.toLowerCase()));
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: filtered
      };
    }
    if (method === 'POST') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
      const newListing = {
        id: storage.listings.length + 1,
        crop_name: body.crop_name || body.crop || "Fresh Produce",
        quantity: body.quantity || "100kg",
        price: body.price || "₹2,500/quintal",
        location: body.location || body.loc || "Local Mandi",
        description: body.description || "Farm fresh harvest",
        is_organic: body.is_organic ?? true,
        grade: body.grade || "A",
        trend: "stable",
        seller_name: storage.user.name || "Ramesh Patil",
        image_url: body.image_url || "https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?w=1000&q=80"
      };
      storage.listings.unshift(newListing);
      saveStorage(storage);
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: newListing
      };
    }
  }

  // Market Price Check
  if (pathname === '/market/price-check') {
    const q = params.get('query') || config.params?.query || 'Wheat';
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        text: `Current ${q} trading price in Maharashtra is ₹2,800 - ₹3,400/quintal. Prices are forecasted to rise by 4.5% over the next 10 days due to high milling demand.`
      }
    };
  }

  // 6. Plots
  if (pathname === '/plots/' || pathname === '/plots') {
    if (method === 'GET') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: storage.plots
      };
    }
    if (method === 'POST') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
      const newPlot = {
        id: storage.plots.length + 1,
        name: body.name || `Field #${storage.plots.length + 1}`,
        coordinates: body.coordinates || [
          { lat: 21.146, lng: 79.089 },
          { lat: 21.147, lng: 79.089 },
          { lat: 21.147, lng: 79.090 },
          { lat: 21.146, lng: 79.090 }
        ],
        area: Number(body.area) || 2.0,
        crop_type: body.crop_type || "Cotton",
        health_score: 0.89,
        moisture: 33.5,
        created_at: new Date().toISOString(),
        image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        last_scan_date: new Date().toISOString()
      };
      storage.plots.push(newPlot);
      saveStorage(storage);
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: newPlot
      };
    }
  }

  // SSE Analysis
  if (pathname === '/sse_analysis/analyze-plot') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { job_id: `task_sat_${Date.now()}` }
    };
  }

  if (pathname.startsWith('/sse_analysis/task-status/')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        status: 'success',
        result: {
          ndvi: 0.76,
          ndwi: 0.32,
          soil_moisture_percent: 34.5,
          stress_index: "Low",
          crop_vigor: "High",
          anomaly_detected: false,
          recommendation: "Canopy vigor is optimal. Maintain scheduled irrigation in 3 days."
        }
      }
    };
  }

  // 7. Carbon Projects & Carbon Wallet
  if (pathname === '/carbon/projects') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: storage.carbonProjects
    };
  }

  if (pathname === '/carbon/schemes') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: [
        { name: "Verra VM0042 - Improved Agricultural Land Management", credits_per_ha: 2.8, settlement_period: "Annual" },
        { name: "Puro.earth Biochar Carbon Removal Standard", credits_per_ha: 4.5, settlement_period: "Bi-annual" },
        { name: "Gold Standard Soil Organic Carbon Programme", credits_per_ha: 3.2, settlement_period: "Quarterly" }
      ]
    };
  }

  if (pathname.includes('/carbon/plots/') && pathname.includes('/monitor')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        analysis: {
          projected_credits: 42.5,
          current_sequestration_rate: "2.4 tCO2e/ha/yr",
          soil_carbon_gain: "+0.34% SOC",
          compliance_status: "Verified by Sentinel-2 & GEE"
        }
      }
    };
  }

  if (pathname === '/carbon/enroll') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        success: true,
        project_id: 103,
        gee_job_id: null,
        message: "Plot enrolled successfully in Soil Carbon Credit program."
      }
    };
  }

  if (pathname === '/carbon/wallet') {
    const totalCredits = storage.carbonProjects.reduce((acc, p) => acc + (p.available_credits || 0), 0);
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        balance: totalCredits || 42.0,
        total_earned_inr: (totalCredits || 42.0) * 2000,
        pending_credits: 20.0,
        history: [
          { date: "2026-02-01", description: "Verra Verified Credit Issuance (Plot 1)", credits: 14.0, amount_inr: 28000 },
          { date: "2026-01-15", description: "Puro.Earth Biomass Credit Settlement", credits: 28.0, amount_inr: 56000 }
        ]
      }
    };
  }

  if (pathname === '/carbon/aggregators') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: [
        { name: 'Verra Core', role: 'Global Carbon Standard', settlement_days: 14, fee_percentage: 5, farmer_share_percentage: 95, contact: 'partner@verra.org' },
        { name: 'Puro Earth', role: 'Biochar Specialist', settlement_days: 7, fee_percentage: 6, farmer_share_percentage: 94, contact: 'onboarding@puro.earth' },
        { name: 'Gold Standard', role: 'SDG Climate Impact Leader', settlement_days: 10, fee_percentage: 5, farmer_share_percentage: 95, contact: 'impact@goldstandard.org' }
      ]
    };
  }

  if (pathname.startsWith('/carbon/projects/') && pathname.endsWith('/claim')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { success: true, message: "Payout claim initiated. Funds will be transferred to your registered bank account via UPI within 48 hours." }
    };
  }

  // 8. Schemes
  if (pathname === '/schemes/' || pathname === '/schemes') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: storage.schemes
    };
  }

  if (pathname === '/schemes/apply') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        success: true,
        application_id: `SCH-${Date.now().toString().slice(-6)}`,
        message: "Your application has been registered with the Ministry of Agriculture portal."
      }
    };
  }

  // 9. Community
  if (pathname === '/community/' || pathname === '/community') {
    if (method === 'GET') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: storage.communityPosts
      };
    }
    if (method === 'POST') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
      const newPost = {
        id: storage.communityPosts.length + 1,
        user_name: storage.user.name || "Ramesh Patil",
        user_id: storage.user.id || 1,
        content: body.content || "",
        image_url: body.image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        likes_count: 1,
        created_at: "Just now",
        comments: []
      };
      storage.communityPosts.unshift(newPost);
      saveStorage(storage);
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: newPost
      };
    }
  }

  if (pathname.includes('/community/') && pathname.endsWith('/like')) {
    const id = parseInt(pathname.split('/')[2]);
    const post = storage.communityPosts.find(p => p.id === id);
    if (post) {
      post.likes_count += 1;
      saveStorage(storage);
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { success: true, likes: post?.likes_count || 1 }
    };
  }

  if (pathname.includes('/community/') && pathname.endsWith('/comment')) {
    const id = parseInt(pathname.split('/')[2]);
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const post = storage.communityPosts.find(p => p.id === id);
    if (post) {
      post.comments = post.comments || [];
      post.comments.push({
        id: post.comments.length + 1,
        user_name: storage.user.name || "Ramesh Patil",
        text: body.text || "",
        created_at: "Just now"
      });
      saveStorage(storage);
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { success: true }
    };
  }

  // 10. AI Chat
  if (pathname === '/ai/chat') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const message = body.message || '';
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        response: generateAiAgronomistResponse(message, storage.user)
      }
    };
  }

  // 11. AI Disease Diagnosis
  if (pathname === '/ai/diagnose') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        diagnosis: "Early Leaf Blight (Alternaria solani)",
        disease: "Early Leaf Blight (Alternaria solani)",
        confidence: 94,
        healthScore: 78,
        crop: "Tomato / Solanaceae",
        severity: "Moderate (Level 2)",
        affected_area_percentage: 18.5,
        summary: "Concentric dark brown rings with chlorotic yellow halos on lower leaves.",
        symptoms: "Concentric dark brown rings with chlorotic yellow halos on lower leaves.",
        remedies: [
          {
            title: "Organic Neem Oil Spray",
            desc: "Spray Neem Oil (10,000 ppm) at 3ml/L or fermented cow urine decoction (Dashparni ark) every 7 days.",
            type: "organic"
          },
          {
            title: "Fungicide Intervention",
            desc: "Mancozeb 75% WP @ 2g/L water or Chlorothalonil 75% WP @ 2.5g/L water at early onset.",
            type: "chemical"
          },
          {
            title: "Field Spacing & Mulching",
            desc: "Ensure adequate spacing between rows, mulch soil to stop spore splash, and avoid overhead sprinkler watering during high humidity.",
            type: "organic"
          }
        ],
        organic_treatment: "Spray Neem Oil (10,000 ppm) at 3ml/L or fermented cow urine decoction (Dashparni ark) every 7 days.",
        chemical_treatment: "Mancozeb 75% WP @ 2g/L water or Chlorothalonil 75% WP @ 2.5g/L water at early onset.",
        prevention: "Ensure adequate spacing between rows, mulch soil to stop spore splash, and avoid overhead sprinkler watering during high humidity."
      }
    };
  }

  // 12. Smart Contracts
  if (pathname === '/contracts/' || pathname === '/contracts') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: storage.contracts
    };
  }

  if (pathname === '/contracts/sign') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const c = storage.contracts.find(item => item.id === body.contract_id);
    if (c) {
      c.status = 'Signed';
      saveStorage(storage);
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { success: true, contract: c }
    };
  }

  // 13. Insurance
  if (pathname === '/insurance/search') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: storage.insuranceProducts
    };
  }

  if (pathname === '/insurance/enroll') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        success: true,
        policy_number: `POL-AGR-${Math.floor(100000 + Math.random() * 900000)}`,
        message: "Policy issued successfully and linked to your farmer Aadhaar ID."
      }
    };
  }

  // 14. Traceability Tokens
  if (pathname === '/trace/marketplace' || pathname === '/carbon/my-tokens') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: storage.tokens
    };
  }

  if (pathname.startsWith('/trace/verify/')) {
    const tokenId = pathname.split('/').pop() || '';
    const token = storage.tokens.find(t => t.id === tokenId || t.token_id === tokenId) || storage.tokens[0];
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: token
    };
  }

  // 15. Corporate Portfolio
  if (pathname === '/corporate/portfolio') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        total_offsets_purchased: 1450,
        farmers_supported: 380,
        total_paid_inr: 2900000,
        esg_score_contribution: "+18%",
        active_projects: storage.carbonProjects
      }
    };
  }

  // 16. Crop Cycles
  if (pathname.includes('/cycles/plot/')) {
    const plotId = parseInt(pathname.split('/')[3]) || 1;
    const cycles = storage.cropCycles[plotId] || storage.cropCycles[1] || [];
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: cycles
    };
  }

  // 17. News
  if (pathname === '/news/' || pathname === '/news') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: [
        { id: 1, title: "Maharashtra Mandi Prices Surge as Export Window Opens", source: "Kisan Khabar", time: "3 hours ago" },
        { id: 2, title: "IMD Forecasts Favorable Pre-Monsoon Showers Across Central India", source: "Agri Weather Bureau", time: "6 hours ago" },
        { id: 3, title: "New Subsidy for Micro-Irrigation Drip Kits Announced under PMKSY", source: "Dept of Agriculture", time: "1 day ago" }
      ]
    };
  }

  // 18. Finance Status
  if (pathname === '/finance/status') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        trust_score: 94,
        rainfall_mm: 38.5,
        payout_eligible: true
      }
    };
  }

  // 19. Admin Ops Dashboard Endpoints
  if (pathname.startsWith('/admin/')) {
    if (pathname === '/admin/stats') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: {
          total_farmers: 1482,
          total_acreage: 3640,
          carbon_credits_issued: 14850,
          total_payout_inr: 29700000,
          active_satellite_scans: 128,
          health_index_avg: "87.4%"
        }
      };
    }
    if (pathname === '/admin/farmers') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: [
          { id: 1, name: "Ramesh Patil", phone: "9876543210", district: "Nagpur", acreage: 2.5, plots: 2, credits: 45.5 },
          { id: 2, name: "Sita Devi", phone: "9876543211", district: "Nashik", acreage: 3.5, plots: 3, credits: 62.0 },
          { id: 3, name: "Amit Singh", phone: "9876543212", district: "Amravati", acreage: 4.5, plots: 2, credits: 78.5 }
        ]
      };
    }
    if (pathname === '/admin/carbon/projects') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: storage.carbonProjects
      };
    }
  }

  // 19. Smart Irrigation Recommendation
  if (pathname === '/irrigation/recommend') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const cropName = body.crop_type || 'Wheat';
    const soilType = body.soil_type || 'Black Soil';
    const acres = Number(body.area_acres) || 1;

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        crop_type: cropName,
        soil_type: soilType,
        area_acres: acres,
        water_requirement_per_acre: `${Math.round(2800 * acres)} Liters / cycle`,
        weekly_schedule: [
          { day: 1, day_name: "Monday", should_irrigate: true, duration_minutes: 45, water_amount_liters: Math.round(1400 * acres), method: "Drip Irrigation", note: "Early morning cycle 6:00 AM - 6:45 AM" },
          { day: 2, day_name: "Tuesday", should_irrigate: false, duration_minutes: 0, water_amount_liters: 0, method: "Rest", note: "Soil moisture adequate (36%)" },
          { day: 3, day_name: "Wednesday", should_irrigate: true, duration_minutes: 40, water_amount_liters: Math.round(1200 * acres), method: "Drip Irrigation", note: "Cool evening cycle 6:00 PM - 6:40 PM" },
          { day: 4, day_name: "Thursday", should_irrigate: false, duration_minutes: 0, water_amount_liters: 0, method: "Rest", note: "Root absorption and aeration" },
          { day: 5, day_name: "Friday", should_irrigate: true, duration_minutes: 50, water_amount_liters: Math.round(1500 * acres), method: "Drip Irrigation", note: "Morning cycle 6:00 AM - 6:50 AM" },
          { day: 6, day_name: "Saturday", should_irrigate: false, duration_minutes: 0, water_amount_liters: 0, method: "Rest", note: "Soil moisture retention phase" },
          { day: 7, day_name: "Sunday", should_irrigate: false, duration_minutes: 0, water_amount_liters: 0, method: "Rest", note: "Weekly soil inspection" }
        ],
        total_weekly_water_liters: Math.round(4100 * acres),
        savings_estimate: "32% water saved compared to traditional flood irrigation",
        efficiency_score: 94,
        method_summary: "Precision drip micro-irrigation with early morning cycles to eliminate evaporation loss.",
        ai_tips: [
          "Irrigate strictly during early morning (6:00 - 7:30 AM) to curb thermal evaporation losses by up to 25%.",
          "Apply organic straw mulching to lock in root-zone moisture and reduce weed competition.",
          "Check lateral dripper emitters weekly for mineral or silt clogs to ensure uniform water discharge."
        ]
      }
    };
  }

  // Health check endpoint
  if (pathname === '/health') {
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { status: 'ok', version: '2.4.0', engine: 'Krishi-Drishti Core AI' }
    };
  }

  // Default fallback for any unmatched /api route
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    data: { status: 'success', message: 'Handled by Krishi-Drishti engine' }
  };
}

/**
 * Generates agricultural agronomist responses
 */
function generateAiAgronomistResponse(message: string, user: any): string {
  const m = message.toLowerCase();
  const userName = user?.name ? user.name.split(' ')[0] : 'Farmer';

  if (m.includes('wheat') || m.includes('गेहूं')) {
    return `Namaste ${userName}! For Wheat in your black soil region:\n• Top dressing with Urea (30kg/acre) during the crown root initiation (CRI) stage.\n• If yellow rust symptoms appear, spray Propiconazole 25% EC @ 1ml/L immediately.\n• Ensure irrigation at flowering and grain-filling stages to maximize test weight.`;
  }

  if (m.includes('cotton') || m.includes('कपास')) {
    return `Namaste ${userName}! For Cotton crop management:\n• Inspect underside of leaves for whitefly or thrips. Spray Neem oil (10,000 ppm) @ 3ml/L early morning.\n• For bollworms, install pheromone traps (5 traps per acre) for early bio-monitoring.\n• Avoid excess nitrogen to prevent succulent vegetative overgrowth.`;
  }

  if (m.includes('orange') || m.includes('संत्रा') || m.includes('citrus')) {
    return `Namaste ${userName}! For Nagpur Sweet Orange orchards:\n• Spray micronutrient mixture (Zinc, Manganese, Boron) @ 2g/L after fruit set.\n• For citrus canker, prune affected branches and spray Copper Oxychloride @ 2.5g/L + Streptocycline 1g/10L.\n• Maintain clean basin weeding and mulching around tree canopies.`;
  }

  if (m.includes('carbon') || m.includes('credit')) {
    return `Krishi-Drishti Soil Carbon Program:\n• You can earn up to ₹2,000 per carbon credit by adopting cover cropping, biochar, or zero-tillage.\n• Check your 'Carbon Vault' screen to track satellite verification and claim direct UPI payouts to your bank account!`;
  }

  if (m.includes('pest') || m.includes('कीट') || m.includes('रोग')) {
    return `For pest and disease control:\n• Take a clear leaf photo using our 'AI Diagnosis' scanner camera to get instant disease classification.\n• Recommended biological practice: Spray Dashparni ark or Trichoderma viride early in the season to build natural immunity.`;
  }

  return `Namaste ${userName}! I am your Krishi-Drishti AI Agronomist companion.\n• Current weather in your district is favorable for field operations.\n• Soil moisture index is at healthy levels.\n• Feel free to ask about crop disease diagnosis, mandi market rates, government subsidies, or satellite soil carbon monitoring!`;
}

/**
 * Generates realistic fallback weather data matching Open-Meteo format
 */
export function generateFallbackWeather(lat: number, lng: number): any {
  const hours: string[] = [];
  const hourlyTemp: number[] = [];
  const hourlyWcode: number[] = [];
  const hourlyPop: number[] = [];
  const hourlyWind: number[] = [];
  const hourlyHumidity: number[] = [];
  const hourlyVis: number[] = [];
  const hourlyDay: number[] = [];

  const now = new Date();
  for (let i = 0; i < 72; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    hours.push(d.toISOString().slice(0, 13) + ':00');
    hourlyTemp.push(Math.round(24 + Math.sin(i / 4) * 7));
    hourlyWcode.push(i % 5 === 0 ? 1 : 0);
    hourlyPop.push(i % 8 === 0 ? 15 : 0);
    hourlyWind.push(Math.round(8 + Math.cos(i / 3) * 4));
    hourlyHumidity.push(Math.round(45 + Math.cos(i / 5) * 15));
    hourlyVis.push(10000);
    hourlyDay.push(d.getHours() >= 6 && d.getHours() <= 18 ? 1 : 0);
  }

  const days: string[] = [];
  const maxTemp: number[] = [];
  const minTemp: number[] = [];
  const dailyWcode: number[] = [];
  const dailyUv: number[] = [];
  const dailyPrecip: number[] = [];
  const dailyPop: number[] = [];
  const sunrise: string[] = [];
  const sunset: string[] = [];
  const windMax: number[] = [];
  const gustMax: number[] = [];
  const windDir: number[] = [];

  for (let i = 0; i < 10; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    days.push(d.toISOString().slice(0, 10));
    maxTemp.push(31 + (i % 3));
    minTemp.push(19 + (i % 2));
    dailyWcode.push(i % 4 === 0 ? 1 : 0);
    dailyUv.push(7.5);
    dailyPrecip.push(0);
    dailyPop.push(5);
    sunrise.push(d.toISOString().slice(0, 10) + 'T06:30');
    sunset.push(d.toISOString().slice(0, 10) + 'T18:15');
    windMax.push(12);
    gustMax.push(18);
    windDir.push(270);
  }

  return {
    latitude: lat,
    longitude: lng,
    timezone: "Asia/Kolkata",
    current: {
      temperature_2m: 28.5,
      relative_humidity_2m: 44,
      apparent_temperature: 29.2,
      rain: 0,
      precipitation: 0,
      weather_code: 0,
      is_day: 1,
      wind_speed_10m: 8.5,
      wind_direction_10m: 260,
      surface_pressure: 1012.0,
      cloud_cover: 12,
      visibility: 10000,
      uv_index: 6.8,
      dew_point_2m: 14.5,
      soil_temperature_0cm: 29.8
    },
    hourly: {
      time: hours,
      temperature_2m: hourlyTemp,
      weather_code: hourlyWcode,
      precipitation_probability: hourlyPop,
      apparent_temperature: hourlyTemp,
      wind_speed_10m: hourlyWind,
      visibility: hourlyVis,
      is_day: hourlyDay,
      relative_humidity_2m: hourlyHumidity
    },
    daily: {
      time: days,
      weather_code: dailyWcode,
      temperature_2m_max: maxTemp,
      temperature_2m_min: minTemp,
      sunrise,
      sunset,
      uv_index_max: dailyUv,
      precipitation_sum: dailyPrecip,
      precipitation_probability_max: dailyPop,
      wind_speed_10m_max: windMax,
      wind_gusts_10m_max: gustMax,
      wind_direction_10m_dominant: windDir
    }
  };
}
