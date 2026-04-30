<<<<<<<< HEAD:App.jsx
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  Upload, 
  DollarSign, 
  Home, 
  Star, 
  Trash2,
  FileText,
  TrendingUp,
  MapPin,
  AlignLeft,
  Type,
  Globe,
  Lightbulb,
  Search,
  LayoutDashboard,
  ArrowLeftRight,
  Activity,
  Bed,
  Filter
} from 'lucide-react';

// --- Utility: Simple CSV Parser ---
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const headers = lines[0].split(regex).map(h => h.replace(/^"|"$/g, '').trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(regex);
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
      return obj;
    }, {});
  });
};

const Card = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3 h-full">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

const App = () => {
  const [datasets, setDatasets] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [cityFilter, setCityFilter] = useState('All');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');
  const [bedroomFilter, setBedroomFilter] = useState('All');
  const [bathroomFilter, setBathroomFilter] = useState('All');

  const allDataList = useMemo(() => Object.values(datasets).flat(), [datasets]);

  const activeData = useMemo(() => {
    let data = allDataList;
    if (cityFilter !== 'All') {
      data = data.filter(item => item.cityName === cityFilter);
    }
    if (neighborhoodFilter !== 'All') {
      data = data.filter(item => item.neighbourhood_cleansed === neighborhoodFilter);
    }

    if (activeTab === 'comparison') {
      if (roomTypeFilter !== 'All') {
        data = data.filter(item => item.room_type === roomTypeFilter);
      } else {
        data = data.filter(item => ["Entire home/apt", "Private room"].includes(item.room_type));
      }
      if (bedroomFilter !== 'All') {
        data = data.filter(item => String(item.bedrooms_clean) === bedroomFilter);
      }
      if (bathroomFilter !== 'All') {
        data = data.filter(item => String(item.bathrooms_clean) === bathroomFilter);
      }
    }
    return data;
  }, [allDataList, cityFilter, neighborhoodFilter, roomTypeFilter, bedroomFilter, bathroomFilter, activeTab]);

  const neighborhoods = useMemo(() => {
    const data = cityFilter === 'All' ? allDataList : allDataList.filter(d => d.cityName === cityFilter);
    const unique = [...new Set(data.map(d => d.neighbourhood_cleansed))]
      .filter(n => n && typeof n === 'string' && n.trim() !== '' && isNaN(n))
      .map(n => n.trim());
    return unique.sort((a, b) => a.localeCompare(b));
  }, [allDataList, cityFilter]);

  const filterOptions = useMemo(() => {
    const baseData = allDataList.filter(d => {
      const cityMatch = cityFilter === 'All' || d.cityName === cityFilter;
      const hoodMatch = neighborhoodFilter === 'All' || d.neighbourhood_cleansed === neighborhoodFilter;
      return cityMatch && hoodMatch;
    });

    return {
      roomTypes: ["Entire home/apt", "Private room"],
      bedrooms: [...new Set(baseData.map(d => String(d.bedrooms_clean)))].filter(b => b && b !== 'NaN' && b !== 'null').sort((a, b) => parseInt(a) - parseInt(b)),
      bathrooms: [...new Set(baseData.map(d => String(d.bathrooms_clean)))].filter(b => b && b !== 'NaN' && b !== 'null').sort((a, b) => parseInt(a) - parseInt(b))
    };
  }, [allDataList, cityFilter, neighborhoodFilter]);

  const otherAnalysisStats = useMemo(() => {
    if (!activeData.length) return null;
    const avgEarnings = activeData.reduce((acc, curr) => acc + (curr.revenue_num || 0), 0) / activeData.length;
    const validOccupancyData = activeData.map(d => parseFloat(d.estimated_occupancy_l365d)).filter(val => !isNaN(val));
    const avgOccupancy = validOccupancyData.length > 0 ? validOccupancyData.reduce((acc, curr) => acc + curr, 0) / validOccupancyData.length : 0;

    const bedroomMap = {};
    activeData.forEach(d => {
      const beds = d.bedrooms_clean || 0;
      if (!bedroomMap[beds]) bedroomMap[beds] = { totalRevenue: 0, count: 0 };
      bedroomMap[beds].totalRevenue += d.revenue_num || 0;
      bedroomMap[beds].count += 1;
    });

    let bestBeds = "N/A";
    let maxAvg = 0;
    Object.entries(bedroomMap).forEach(([beds, stats]) => {
      const avg = stats.totalRevenue / stats.count;
      if (avg > maxAvg) { maxAvg = avg; bestBeds = beds; }
    });

    return {
      avgEarnings: Math.round(avgEarnings),
      avgOccupancy: avgOccupancy.toFixed(1),
      bestSetup: `${bestBeds} BR`
    };
  }, [activeData]);

  const getWordMetrics = (data, fieldKey, customBins = null) => {
    if (!data.length) return [];
    const bins = customBins || [
      { label: 'Max Detail (200+)', min: 201, max: 5000, sortOrder: 0 },
      { label: 'Detailed (101-200)', min: 101, max: 200, sortOrder: 1 },
      { label: 'Moderate (51-100)', min: 51, max: 100, sortOrder: 2 },
      { label: 'Brief (11-50)', min: 11, max: 50, sortOrder: 3 },
      { label: 'Minimal (0-10)', min: 0, max: 10, sortOrder: 4 }
    ];

    return bins.map(bin => {
      const matching = data.filter(d => {
        const text = d[fieldKey] || "";
        const val = text.split(/\s+/).filter(Boolean).length;
        return val >= bin.min && val <= bin.max;
      });
      const count = matching.length || 1;
      const avgRev = matching.reduce((acc, curr) => acc + (curr.revenue_num || 0), 0) / count;
      const avgRat = matching.reduce((acc, curr) => acc + (curr.rating || 0), 0) / count;
      return { range: bin.label, avgRevenue: Math.round(avgRev), avgRating: parseFloat(avgRat.toFixed(2)), count: matching.length, sortOrder: bin.sortOrder };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const titleMetrics = useMemo(() => getWordMetrics(activeData, 'name', [
    { label: 'Max Detail (15+)', min: 16, max: 100, sortOrder: 0 },
    { label: 'Descriptive (11-15)', min: 11, max: 15, sortOrder: 1 },
    { label: 'Long (7-10)', min: 7, max: 10, sortOrder: 2 },
    { label: 'Standard (4-6)', min: 4, max: 6, sortOrder: 3 },
    { label: 'Short (1-3)', min: 1, max: 3, sortOrder: 4 }
  ]), [activeData]);

  const descriptionWordMetrics = useMemo(() => getWordMetrics(activeData, 'description'), [activeData]);
  const neighborhoodWordMetrics = useMemo(() => getWordMetrics(activeData, 'neighborhood_overview'), [activeData]);

  const topAmenities = useMemo(() => {
    if (!activeData.length) return [];
    const amenityStats = {};
    activeData.forEach(d => {
      if (!d.amenities) return;
      let parsed = [];
      try {
        parsed = JSON.parse(d.amenities.replace(/""/g, '"'));
      } catch (e) {
        parsed = d.amenities.match(/"([^"]+)"/g)?.map(m => m.replace(/"/g, '')) || d.amenities.split(',').map(s => s.trim());
      }
      if (Array.isArray(parsed)) {
        parsed.forEach(amenity => {
          if (!amenity || typeof amenity !== 'string') return;
          if (!amenityStats[amenity]) amenityStats[amenity] = { name: amenity, revenue: 0, count: 0 };
          amenityStats[amenity].revenue += d.revenue_num || 0;
          amenityStats[amenity].count += 1;
        });
      }
    });
    return Object.values(amenityStats)
      .filter(a => a.count > (activeData.length * 0.05))
      .map(a => ({ name: a.name, avgRevenue: Math.round(a.revenue / a.count) }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)
      .slice(0, 5);
  }, [activeData]);

  const topRatedListings = useMemo(() => {
    return activeData
      .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.rating - a.rating || b.number_of_reviews - a.number_of_reviews)
      .slice(0, 5);
  }, [activeData, searchQuery]);

  const volumeComparisonData = useMemo(() => {
    const counts = {};
    allDataList.forEach(d => { counts[d.cityName] = (counts[d.cityName] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allDataList]);

  const cityComparison = useMemo(() => {
    const cities = [...new Set(allDataList.map(d => d.cityName))];
    return cities.map(city => {
      const cityData = allDataList.filter(d => d.cityName === city);
      return {
        name: city,
        avgPrice: (cityData.reduce((acc, curr) => acc + curr.price_num, 0) / cityData.length || 0).toFixed(2),
        successRate: ((cityData.filter(d => d.isSuccessful).length / cityData.length) * 100 || 0).toFixed(1)
      };
    });
  }, [allDataList]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    setLoading(true);
    let loadedCount = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawData = parseCSV(e.target.result);
          const cleanedData = rawData.map(row => {
            const price = parseFloat(row.price?.replace(/[€$,]/g, '')) || 0;
            const rating = parseFloat(row.review_scores_rating) || 0;
            const revenue = parseFloat(row.estimated_revenue_l365d) || 0;
            const reviews = parseInt(row.number_of_reviews) || 0;
            const cityName = file.name.toLowerCase().includes('munich') ? 'Munich' : 
                            file.name.toLowerCase().includes('berlin') ? 'Berlin' : 'Other';
            const rawBeds = row.bedrooms || "0";
            const bedroomsClean = parseInt(String(rawBeds).replace(/\D/g, '')) || 0;
            const rawBaths = row.bathrooms || row.bathrooms_text || "0";
            const bathroomsClean = Math.floor(parseFloat(String(rawBaths).match(/[\d.]+/)?.[0] || 0));
            return {
              ...row,
              price_num: price, rating: rating, revenue_num: revenue,
              number_of_reviews: reviews, bedrooms_clean: bedroomsClean,
              bathrooms_clean: bathroomsClean, isSuccessful: rating >= 4.8, cityName: cityName
            };
          }).filter(row => row.price_num > 0);
          setDatasets(prev => ({ ...prev, [file.name]: cleanedData }));
        } finally {
          loadedCount++;
          if (loadedCount === files.length) setLoading(false);
        }
      };
      reader.readAsText(file);
    });
  };

  if (Object.keys(datasets).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            {loading ? <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div> : <Upload className="w-10 h-10 text-rose-500" />}
          </div>
          <div><h1 className="text-2xl font-bold">Market Analytics Dashboard</h1><p className="text-gray-500">Upload listing CSVs to analyze correlations.</p></div>
          <input type="file" accept=".csv" multiple onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-50 bg-gray-50/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Airbnb Market Dashboard</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {Object.keys(datasets).map(name => (
                  <span key={name} className="px-2 py-0.5 bg-white border rounded text-[10px] flex items-center gap-1.5 font-medium text-gray-600">
                    {datasets[name]?.[0]?.cityName || name}
                    <button onClick={() => setDatasets(p => { const n = {...p}; delete n[name]; return n; })}><Trash2 className="w-3 h-3 text-red-400 hover:text-red-600"/></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'analysis', icon: FileText, label: 'Text Analysis' },
                { id: 'comparison', icon: ArrowLeftRight, label: 'Other Analysis' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <tab.icon className="w-3.5 h-3.5"/> {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Listings" value={activeData.length} icon={Home} color="bg-blue-500" />
            <Card title="Avg Price" value={`€${activeData.length ? (activeData.reduce((a, b) => a + b.price_num, 0)/activeData.length).toFixed(0) : 0}`} icon={DollarSign} color="bg-emerald-500" />
            <Card title="High Rating %" value={`${activeData.length ? ((activeData.filter(d => d.isSuccessful).length/activeData.length)*100).toFixed(1) : 0}%`} icon={Star} color="bg-rose-500" subtitle="Ratings >= 4.8" />
            <Card title="Avg Rating" value={(activeData.reduce((a, b) => a + b.rating, 0) / (activeData.length || 1)).toFixed(2)} icon={Star} color="bg-amber-500" />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100">
             <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-lg shadow-sm">
                   {activeTab === 'analysis' ? <FileText className="w-5 h-5 text-white" /> : activeTab === 'overview' ? <LayoutDashboard className="w-5 h-5 text-white" /> : <ArrowLeftRight className="w-5 h-5 text-white" />}
                </div>
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                  {activeTab === 'analysis' ? 'Text Analysis' : activeTab === 'overview' ? 'Overview' : 'Other Analysis'}
                </h2>
             </div>
             <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <div className="px-3 py-2 text-gray-400 border-r border-gray-100 mr-1"><Globe className="w-4 h-4" /></div>
                  {['All', 'Berlin', 'Munich'].map(city => (
                    <button key={city} onClick={() => { setCityFilter(city); setNeighborhoodFilter('All'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cityFilter === city ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>{city}</button>
                  ))}
                </div>
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex items-center min-w-[200px]">
                  <div className="px-3 py-2 text-gray-400 border-r border-gray-100 mr-1"><MapPin className="w-4 h-4" /></div>
                  <select value={neighborhoodFilter} onChange={(e) => setNeighborhoodFilter(e.target.value)} className="w-full pr-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 appearance-none focus:outline-none cursor-pointer bg-transparent">
                    <option value="All">All Neighborhoods</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-1.5 bg-[#FF5A5F] rounded-lg text-white shadow-md"><Lightbulb className="w-4 h-4 fill-white/20"/></div>
                <h3 className="font-bold text-gray-800 text-base tracking-tight">Recommendations for Hosts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#FF5A5F]"><Star className="w-4 h-4" /><p className="text-[11px] font-black uppercase tracking-widest">Success Factors</p></div>
                  <p className="text-[15px] font-bold text-gray-900 leading-snug">Success is driven by rating density. Listings with 50+ reviews maintain 15% higher occupancy rates than newer ones.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#FF5A5F]"><Globe className="w-4 h-4" /><p className="text-[11px] font-black uppercase tracking-widest">Regional Observation</p></div>
                  <p className="text-[15px] font-bold text-gray-900 leading-snug">In Berlin a "Smart Lock" is key, while in Munich "Portable fans" are high demand.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#FF5A5F]"><TrendingUp className="w-4 h-4" /><p className="text-[11px] font-black uppercase tracking-widest">Interesting Trend</p></div>
                  <p className="text-[15px] font-bold text-gray-900 leading-snug">Neighborhoods like Moabit Ost favor family amenities (high chairs), while others vary.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-800"><Star className="w-5 h-5 text-emerald-500" /> Top 5 Amenities by Revenue</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topAmenities} layout="vertical" margin={{ left: 80, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                        <YAxis dataKey="name" type="category" width={100} fontSize={10} stroke="#4b5563" />
                        <Tooltip formatter={(v) => [`€${v}`, 'Avg Revenue']} />
                        <Bar dataKey="avgRevenue" fill="#00A699" radius={[0, 4, 4, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-lg text-gray-800">Top Rated Listings</h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search name..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Market</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Listing</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Price</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-center">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {topRatedListings.map((listing, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4"><span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase">{listing.cityName}</span></td>
                            <td className="px-6 py-4 text-sm font-semibold truncate max-w-[200px]">{listing.name}</td>
                            <td className="px-6 py-4 text-sm font-bold text-right">€{listing.price_num}</td>
                            <td className="px-6 py-4 text-center">★{listing.rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-6">Volume Comparison</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={volumeComparisonData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {volumeComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#00A699' : '#FF5A5F'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="space-y-12">
              {[
                { title: 'Listing Title', icon: Type, metrics: titleMetrics, iconColor: 'indigo' },
                { title: 'Listing Description', icon: AlignLeft, metrics: descriptionWordMetrics, iconColor: 'blue' },
                { title: 'Neighborhood Description', icon: MapPin, metrics: neighborhoodWordMetrics, iconColor: 'rose' }
              ].map((section, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-${section.iconColor}-50 rounded-lg text-${section.iconColor}-600`}><section.icon className="w-6 h-6"/></div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="h-72 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={section.metrics} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" fontSize={10} angle={-15} textAnchor="end" />
                        <YAxis yAxisId="left" stroke="#00A699" tickFormatter={(v) => `€${v}`} fontSize={9} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={[4, 5]} fontSize={9} />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="avgRevenue" fill="#00A699" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-gray-400"><Filter className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Property Filters</span></div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Room Type</label>
                <select value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)} className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none">
                  <option value="All">All Valid Types</option>
                  {filterOptions.roomTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Bedrooms</label>
                <select value={bedroomFilter} onChange={(e) => setBedroomFilter(e.target.value)} className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none">
                  <option value="All">All Bedrooms</option>
                  {filterOptions.bedrooms.map(b => <option key={b} value={b}>{b} BR</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Bathrooms</label>
                <select value={bathroomFilter} onChange={(e) => setBathroomFilter(e.target.value)} className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none">
                  <option value="All">All Bathrooms</option>
                  {filterOptions.bathrooms.map(ba => <option key={ba} value={ba}>{ba} BA</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Average Annual Earnings" value={`€${otherAnalysisStats?.avgEarnings?.toLocaleString() || '0'}`} icon={DollarSign} color="bg-emerald-600" />
              <Card title="Typical Occupancy" value={otherAnalysisStats?.avgOccupancy || '0'} icon={Activity} color="bg-indigo-600" />
              <Card title="Best Setup" value={otherAnalysisStats?.bestSetup || 'N/A'} icon={Bed} color="bg-amber-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold mb-6 text-gray-800">Price Yield Comparison</h3>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={cityComparison}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" />
                       <YAxis tickFormatter={(v) => `€${v}`} fontSize={10} />
                       <Tooltip />
                       <Bar dataKey="avgPrice" fill="#00A699" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
========
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  Upload, 
  DollarSign, 
  Home, 
  Star, 
  Trash2,
  FileText,
  TrendingUp,
  MapPin,
  AlignLeft,
  Type,
  Globe,
  Lightbulb,
  Search,
  LayoutDashboard,
  ArrowLeftRight,
  Activity,
  Bed,
  Filter
} from 'lucide-react';

// --- Utility: Simple CSV Parser ---
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const headers = lines[0].split(regex).map(h => h.replace(/^"|"$/g, '').trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(regex);
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
      return obj;
    }, {});
  });
};

const Card = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3 h-full">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

const App = () => {
  const [datasets, setDatasets] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [cityFilter, setCityFilter] = useState('All');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');
  const [bedroomFilter, setBedroomFilter] = useState('All');
  const [bathroomFilter, setBathroomFilter] = useState('All');

  const allDataList = useMemo(() => Object.values(datasets).flat(), [datasets]);

  const activeData = useMemo(() => {
    let data = allDataList;
    if (cityFilter !== 'All') {
      data = data.filter(item => item.cityName === cityFilter);
    }
    if (neighborhoodFilter !== 'All') {
      data = data.filter(item => item.neighbourhood_cleansed === neighborhoodFilter);
    }

    if (activeTab === 'comparison') {
      if (roomTypeFilter !== 'All') {
        data = data.filter(item => item.room_type === roomTypeFilter);
      } else {
        data = data.filter(item => ["Entire home/apt", "Private room"].includes(item.room_type));
      }
      if (bedroomFilter !== 'All') {
        data = data.filter(item => String(item.bedrooms_clean) === bedroomFilter);
      }
      if (bathroomFilter !== 'All') {
        data = data.filter(item => String(item.bathrooms_clean) === bathroomFilter);
      }
    }
    return data;
  }, [allDataList, cityFilter, neighborhoodFilter, roomTypeFilter, bedroomFilter, bathroomFilter, activeTab]);

  const neighborhoods = useMemo(() => {
    const data = cityFilter === 'All' ? allDataList : allDataList.filter(d => d.cityName === cityFilter);
    const unique = [...new Set(data.map(d => d.neighbourhood_cleansed))]
      .filter(n => n && typeof n === 'string' && n.trim() !== '' && isNaN(n))
      .map(n => n.trim());
    return unique.sort((a, b) => a.localeCompare(b));
  }, [allDataList, cityFilter]);

  const filterOptions = useMemo(() => {
    const baseData = allDataList.filter(d => {
      const cityMatch = cityFilter === 'All' || d.cityName === cityFilter;
      const hoodMatch = neighborhoodFilter === 'All' || d.neighbourhood_cleansed === neighborhoodFilter;
      return cityMatch && hoodMatch;
    });

    return {
      roomTypes: ["Entire home/apt", "Private room"],
      bedrooms: [...new Set(baseData.map(d => String(d.bedrooms_clean)))].filter(b => b && b !== 'NaN' && b !== 'null').sort((a, b) => parseInt(a) - parseInt(b)),
      bathrooms: [...new Set(baseData.map(d => String(d.bathrooms_clean)))].filter(b => b && b !== 'NaN' && b !== 'null').sort((a, b) => parseInt(a) - parseInt(b))
    };
  }, [allDataList, cityFilter, neighborhoodFilter]);

  const otherAnalysisStats = useMemo(() => {
    if (!activeData.length) return null;
    const avgEarnings = activeData.reduce((acc, curr) => acc + (curr.revenue_num || 0), 0) / activeData.length;
    const validOccupancyData = activeData.map(d => parseFloat(d.estimated_occupancy_l365d)).filter(val => !isNaN(val));
    const avgOccupancy = validOccupancyData.length > 0 ? validOccupancyData.reduce((acc, curr) => acc + curr, 0) / validOccupancyData.length : 0;

    const bedroomMap = {};
    activeData.forEach(d => {
      const beds = d.bedrooms_clean || 0;
      if (!bedroomMap[beds]) bedroomMap[beds] = { totalRevenue: 0, count: 0 };
      bedroomMap[beds].totalRevenue += d.revenue_num || 0;
      bedroomMap[beds].count += 1;
    });

    let bestBeds = "N/A";
    let maxAvg = 0;
    Object.entries(bedroomMap).forEach(([beds, stats]) => {
      const avg = stats.totalRevenue / stats.count;
      if (avg > maxAvg) { maxAvg = avg; bestBeds = beds; }
    });

    return {
      avgEarnings: Math.round(avgEarnings),
      avgOccupancy: avgOccupancy.toFixed(1),
      bestSetup: `${bestBeds} BR`
    };
  }, [activeData]);

  const getWordMetrics = (data, fieldKey, customBins = null) => {
    if (!data.length) return [];
    const bins = customBins || [
      { label: 'Max Detail (200+)', min: 201, max: 5000, sortOrder: 0 },
      { label: 'Detailed (101-200)', min: 101, max: 200, sortOrder: 1 },
      { label: 'Moderate (51-100)', min: 51, max: 100, sortOrder: 2 },
      { label: 'Brief (11-50)', min: 11, max: 50, sortOrder: 3 },
      { label: 'Minimal (0-10)', min: 0, max: 10, sortOrder: 4 }
    ];

    return bins.map(bin => {
      const matching = data.filter(d => {
        const text = d[fieldKey] || "";
        const val = text.split(/\s+/).filter(Boolean).length;
        return val >= bin.min && val <= bin.max;
      });
      const count = matching.length || 1;
      const avgRev = matching.reduce((acc, curr) => acc + (curr.revenue_num || 0), 0) / count;
      const avgRat = matching.reduce((acc, curr) => acc + (curr.rating || 0), 0) / count;
      return { range: bin.label, avgRevenue: Math.round(avgRev), avgRating: parseFloat(avgRat.toFixed(2)), count: matching.length, sortOrder: bin.sortOrder };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const titleMetrics = useMemo(() => getWordMetrics(activeData, 'name', [
    { label: 'Max Detail (15+)', min: 16, max: 100, sortOrder: 0 },
    { label: 'Descriptive (11-15)', min: 11, max: 15, sortOrder: 1 },
    { label: 'Long (7-10)', min: 7, max: 10, sortOrder: 2 },
    { label: 'Standard (4-6)', min: 4, max: 6, sortOrder: 3 },
    { label: 'Short (1-3)', min: 1, max: 3, sortOrder: 4 }
  ]), [activeData]);

  const descriptionWordMetrics = useMemo(() => getWordMetrics(activeData, 'description'), [activeData]);
  const neighborhoodWordMetrics = useMemo(() => getWordMetrics(activeData, 'neighborhood_overview'), [activeData]);

  const topAmenities = useMemo(() => {
    if (!activeData.length) return [];
    const amenityStats = {};
    activeData.forEach(d => {
      if (!d.amenities) return;
      let parsed = [];
      try {
        parsed = JSON.parse(d.amenities.replace(/""/g, '"'));
      } catch (e) {
        parsed = d.amenities.match(/"([^"]+)"/g)?.map(m => m.replace(/"/g, '')) || d.amenities.split(',').map(s => s.trim());
      }
      if (Array.isArray(parsed)) {
        parsed.forEach(amenity => {
          if (!amenity || typeof amenity !== 'string') return;
          if (!amenityStats[amenity]) amenityStats[amenity] = { name: amenity, revenue: 0, count: 0 };
          amenityStats[amenity].revenue += d.revenue_num || 0;
          amenityStats[amenity].count += 1;
        });
      }
    });
    return Object.values(amenityStats)
      .filter(a => a.count > (activeData.length * 0.05))
      .map(a => ({ name: a.name, avgRevenue: Math.round(a.revenue / a.count) }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)
      .slice(0, 5);
  }, [activeData]);

  const topRatedListings = useMemo(() => {
    return activeData
      .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.rating - a.rating || b.number_of_reviews - a.number_of_reviews)
      .slice(0, 5);
  }, [activeData, searchQuery]);

  const volumeComparisonData = useMemo(() => {
    const counts = {};
    allDataList.forEach(d => { counts[d.cityName] = (counts[d.cityName] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allDataList]);

  const cityComparison = useMemo(() => {
    const cities = [...new Set(allDataList.map(d => d.cityName))];
    return cities.map(city => {
      const cityData = allDataList.filter(d => d.cityName === city);
      return {
        name: city,
        avgPrice: (cityData.reduce((acc, curr) => acc + curr.price_num, 0) / cityData.length || 0).toFixed(2),
        successRate: ((cityData.filter(d => d.isSuccessful).length / cityData.length) * 100 || 0).toFixed(1)
      };
    });
  }, [allDataList]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    setLoading(true);
    let loadedCount = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawData = parseCSV(e.target.result);
          const cleanedData = rawData.map(row => {
            const price = parseFloat(row.price?.replace(/[€$,]/g, '')) || 0;
            const rating = parseFloat(row.review_scores_rating) || 0;
            const revenue = parseFloat(row.estimated_revenue_l365d) || 0;
            const reviews = parseInt(row.number_of_reviews) || 0;
            const cityName = file.name.toLowerCase().includes('munich') ? 'Munich' : 
                            file.name.toLowerCase().includes('berlin') ? 'Berlin' : 'Other';
            const rawBeds = row.bedrooms || "0";
            const bedroomsClean = parseInt(String(rawBeds).replace(/\D/g, '')) || 0;
            const rawBaths = row.bathrooms || row.bathrooms_text || "0";
            const bathroomsClean = Math.floor(parseFloat(String(rawBaths).match(/[\d.]+/)?.[0] || 0));
            return {
              ...row,
              price_num: price, rating: rating, revenue_num: revenue,
              number_of_reviews: reviews, bedrooms_clean: bedroomsClean,
              bathrooms_clean: bathroomsClean, isSuccessful: rating >= 4.8, cityName: cityName
            };
          }).filter(row => row.price_num > 0);
          setDatasets(prev => ({ ...prev, [file.name]: cleanedData }));
        } finally {
          loadedCount++;
          if (loadedCount === files.length) setLoading(false);
        }
      };
      reader.readAsText(file);
    });
  };

  if (Object.keys(datasets).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            {loading ? <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div> : <Upload className="w-10 h-10 text-rose-500" />}
          </div>
          <div><h1 className="text-2xl font-bold">Market Analytics Dashboard</h1><p className="text-gray-500">Upload listing CSVs to analyze correlations.</p></div>
          <input type="file" accept=".csv" multiple onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-50 bg-gray-50/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Airbnb Market Dashboard</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {Object.keys(datasets).map(name => (
                  <span key={name} className="px-2 py-0.5 bg-white border rounded text-[10px] flex items-center gap-1.5 font-medium text-gray-600">
                    {datasets[name]?.[0]?.cityName || name}
                    <button onClick={() => setDatasets(p => { const n = {...p}; delete n[name]; return n; })}><Trash2 className="w-3 h-3 text-red-400 hover:text-red-600"/></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'analysis', icon: FileText, label: 'Text Analysis' },
                { id: 'comparison', icon: ArrowLeftRight, label: 'Other Analysis' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <tab.icon className="w-3.5 h-3.5"/> {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Listings" value={activeData.length} icon={Home} color="bg-blue-500" />
            <Card title="Avg Price" value={`€${activeData.length ? (activeData.reduce((a, b) => a + b.price_num, 0)/activeData.length).toFixed(0) : 0}`} icon={DollarSign} color="bg-emerald-500" />
            <Card title="High Rating %" value={`${activeData.length ? ((activeData.filter(d => d.isSuccessful).length/activeData.length)*100).toFixed(1) : 0}%`} icon={Star} color="bg-rose-500" subtitle="Ratings >= 4.8" />
            <Card title="Avg Rating" value={(activeData.reduce((a, b) => a + b.rating, 0) / (activeData.length || 1)).toFixed(2)} icon={Star} color="bg-amber-500" />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100">
             <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-lg shadow-sm">
                   {activeTab === 'analysis' ? <FileText className="w-5 h-5 text-white" /> : activeTab === 'overview' ? <LayoutDashboard className="w-5 h-5 text-white" /> : <ArrowLeftRight className="w-5 h-5 text-white" />}
                </div>
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                  {activeTab === 'analysis' ? 'Text Analysis' : activeTab === 'overview' ? 'Overview' : 'Other Analysis'}
                </h2>
             </div>
             <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <div className="px-3 py-2 text-gray-400 border-r border-gray-100 mr-1"><Globe className="w-4 h-4" /></div>
                  {['All', 'Berlin', 'Munich'].map(city => (
                    <button key={city} onClick={() => { setCityFilter(city); setNeighborhoodFilter('All'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cityFilter === city ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>{city}</button>
                  ))}
                </div>
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex items-center min-w-[200px]">
                  <div className="px-3 py-2 text-gray-400 border-r border-gray-100 mr-1"><MapPin className="w-4 h-4" /></div>
                  <select value={neighborhoodFilter} onChange={(e) => setNeighborhoodFilter(e.target.value)} className="w-full pr-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 appearance-none focus:outline-none cursor-pointer bg-transparent">
                    <option value="All">All Neighborhoods</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-1.5 bg-[#FF5A5F] rounded-lg text-white shadow-md"><Lightbulb className="w-4 h-4 fill-white/20"/></div>
                <h3 className="font-bold text-gray-800 text-base tracking-tight">Recommendations for Hosts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#FF5A5F]"><Star className="w-4 h-4" /><p className="text-[11px] font-black uppercase tracking-widest">Success Factors</p></div>
                  <p className="text-[15px] font-bold text-gray-900 leading-snug">Success is driven by rating density. Listings with 50+ reviews maintain 15% higher occupancy rates than newer ones.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#FF5A5F]"><Globe className="w-4 h-4" /><p className="text-[11px] font-black uppercase tracking-widest">Regional Observation</p></div>
                  <p className="text-[15px] font-bold text-gray-900 leading-snug">In Berlin a "Smart Lock" is key, while in Munich "Portable fans" are high demand.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#FF5A5F]"><TrendingUp className="w-4 h-4" /><p className="text-[11px] font-black uppercase tracking-widest">Interesting Trend</p></div>
                  <p className="text-[15px] font-bold text-gray-900 leading-snug">Neighborhoods like Moabit Ost favor family amenities (high chairs), while others vary.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-800"><Star className="w-5 h-5 text-emerald-500" /> Top 5 Amenities by Revenue</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topAmenities} layout="vertical" margin={{ left: 80, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                        <YAxis dataKey="name" type="category" width={100} fontSize={10} stroke="#4b5563" />
                        <Tooltip formatter={(v) => [`€${v}`, 'Avg Revenue']} />
                        <Bar dataKey="avgRevenue" fill="#00A699" radius={[0, 4, 4, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-lg text-gray-800">Top Rated Listings</h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search name..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Market</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Listing</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Price</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-center">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {topRatedListings.map((listing, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4"><span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase">{listing.cityName}</span></td>
                            <td className="px-6 py-4 text-sm font-semibold truncate max-w-[200px]">{listing.name}</td>
                            <td className="px-6 py-4 text-sm font-bold text-right">€{listing.price_num}</td>
                            <td className="px-6 py-4 text-center">★{listing.rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-6">Volume Comparison</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={volumeComparisonData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {volumeComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#00A699' : '#FF5A5F'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="space-y-12">
              {[
                { title: 'Listing Title', icon: Type, metrics: titleMetrics, iconColor: 'indigo' },
                { title: 'Listing Description', icon: AlignLeft, metrics: descriptionWordMetrics, iconColor: 'blue' },
                { title: 'Neighborhood Description', icon: MapPin, metrics: neighborhoodWordMetrics, iconColor: 'rose' }
              ].map((section, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-${section.iconColor}-50 rounded-lg text-${section.iconColor}-600`}><section.icon className="w-6 h-6"/></div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="h-72 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={section.metrics} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" fontSize={10} angle={-15} textAnchor="end" />
                        <YAxis yAxisId="left" stroke="#00A699" tickFormatter={(v) => `€${v}`} fontSize={9} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={[4, 5]} fontSize={9} />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="avgRevenue" fill="#00A699" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-gray-400"><Filter className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Property Filters</span></div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Room Type</label>
                <select value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)} className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none">
                  <option value="All">All Valid Types</option>
                  {filterOptions.roomTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Bedrooms</label>
                <select value={bedroomFilter} onChange={(e) => setBedroomFilter(e.target.value)} className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none">
                  <option value="All">All Bedrooms</option>
                  {filterOptions.bedrooms.map(b => <option key={b} value={b}>{b} BR</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Bathrooms</label>
                <select value={bathroomFilter} onChange={(e) => setBathroomFilter(e.target.value)} className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none">
                  <option value="All">All Bathrooms</option>
                  {filterOptions.bathrooms.map(ba => <option key={ba} value={ba}>{ba} BA</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Average Annual Earnings" value={`€${otherAnalysisStats?.avgEarnings?.toLocaleString() || '0'}`} icon={DollarSign} color="bg-emerald-600" />
              <Card title="Typical Occupancy" value={otherAnalysisStats?.avgOccupancy || '0'} icon={Activity} color="bg-indigo-600" />
              <Card title="Best Setup" value={otherAnalysisStats?.bestSetup || 'N/A'} icon={Bed} color="bg-amber-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold mb-6 text-gray-800">Price Yield Comparison</h3>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={cityComparison}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" />
                       <YAxis tickFormatter={(v) => `€${v}`} fontSize={10} />
                       <Tooltip />
                       <Bar dataKey="avgPrice" fill="#00A699" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
>>>>>>>> 61d20c2dfce1f530db036f8e017e040b066e5c79:app.jsx.txt
