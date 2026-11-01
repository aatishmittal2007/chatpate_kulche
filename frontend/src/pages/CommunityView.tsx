import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, ThumbsUp, CheckCircle, MapPin, Plus, ShieldCheck } from 'lucide-react';
import { Station, CommunityReport, ReportCluster } from '../types';
import { fetchCommunityReports, submitCommunityReport, fetchCommunityClusters, upvoteCommunityReport } from '../services/api';

interface CommunityViewProps {
  stations: Station[];
  selectedStationId: string;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ stations, selectedStationId }) => {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [clusters, setClusters] = useState<ReportCluster[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [category, setCategory] = useState('Firecracker Burning');
  const [visibility, setVisibility] = useState('< 100m');
  const [smell, setSmell] = useState('Heavy burning smell');
  const [crackerActivity, setCrackerActivity] = useState('Continuous heavy bursts');
  const [description, setDescription] = useState('');
  const [selectedStation, setSelectedStation] = useState(selectedStationId);

  const loadReportsAndClusters = async () => {
    try {
      const [reps, cls] = await Promise.all([
        fetchCommunityReports(),
        fetchCommunityClusters()
      ]);
      setReports(reps);
      setClusters(cls);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      await upvoteCommunityReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const stn = stations.find(s => s.id === selectedStation) || stations[0];

    try {
      await submitCommunityReport({
        latitude: stn.latitude + (Math.random() - 0.5) * 0.015,
        longitude: stn.longitude + (Math.random() - 0.5) * 0.015,
        neighbourhood_id: stn.id,
        category,
        visibility_level: visibility,
        smell_intensity: smell,
        cracker_activity: crackerActivity,
        description
      });
      setShowModal(false);
      setDescription('');
      loadReportsAndClusters();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadReportsAndClusters();
  }, []);

  return (
    <div className="space-y-6">
      {/* Standardized Module Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D1DFD4] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3EA] border border-[#D1DFD4] flex items-center justify-center text-[#133E26] shrink-0">
            <Users className="w-5 h-5 text-[#133E26]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-[#133E26] font-sans">
                Citizen Air Quality Reports &amp; Ground Verification
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#EBF3EA] text-[#133E26] border border-[#85A98F]">
                Crowdsourced
              </span>
            </div>
            <p className="text-xs text-[#4A6B56] mt-0.5">
              Crowdsourced festival pollution observations validated via official station proximity &amp; spatial clustering
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#133E26] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Ground Observation</span>
        </button>
      </div>

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {clusters.map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-[#D1DFD4] shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#133E26] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Cluster {i + 1}: {c.dominant_category}</span>
              </div>
              <div className="text-xs text-[#4A6B56] mt-1">
                {c.report_count} citizen reports &bull; Lat: {c.center_lat.toFixed(2)}, Lon: {c.center_lon.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs px-2 py-0.5 bg-[#EBF3EA] text-[#047857] rounded font-bold">
                {c.avg_reliability}% Conf
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Feed */}
      <div className="bg-white rounded-lg border border-[#D1DFD4] shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0D2818] mb-4">
          Verified Citizen Observation Stream
        </h3>

        <div className="divide-y divide-[#EBF3EA] space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0D2818]">{r.category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    r.status === 'verified'
                      ? 'bg-[#EBF3EA] text-[#047857]'
                      : (r.status === 'pending' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#FEE2E2] text-[#DC2626]')
                  }`}>
                    {r.status} ({r.reliability_score.toFixed(0)}% Score)
                  </span>
                  <span className="text-[11px] text-[#4A6B56]">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-[#0D2818] leading-relaxed">
                  "{r.description}"
                </p>

                <div className="flex flex-wrap gap-3 text-[11px] text-[#4A6B56] pt-1">
                  <span>Visibility: <strong>{r.visibility_level}</strong></span>
                  <span>Smell: <strong>{r.smell_intensity}</strong></span>
                  <span>Firecrackers: <strong>{r.cracker_activity}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpvote(r.id)}
                  className="px-3 py-1.5 rounded border border-[#D1DFD4] hover:bg-[#EBF3EA] text-xs font-medium text-[#133E26] flex items-center gap-1.5 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Verify ({r.upvotes})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#D1DFD4] shadow-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#EBF3EA] pb-3">
              <h3 className="text-sm font-bold text-[#0D2818]">Submit Citizen Pollution Report</h3>
              <button onClick={() => setShowModal(false)} className="text-[#4A6B56] hover:text-[#0D2818] text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#4A6B56] block mb-1">Target Neighbourhood:</label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                >
                  {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#4A6B56] block mb-1">Primary Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                  >
                    <option>Firecracker Burning</option>
                    <option>Dense Smoke</option>
                    <option>Burning Smell</option>
                    <option>Low Visibility</option>
                    <option>Dust & Construction</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#4A6B56] block mb-1">Estimated Visibility:</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                  >
                    <option>&lt; 50m</option>
                    <option>&lt; 100m</option>
                    <option>&lt; 200m</option>
                    <option>&lt; 500m</option>
                    <option>&gt; 500m</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#4A6B56] block mb-1">Smell Intensity:</label>
                  <select
                    value={smell}
                    onChange={(e) => setSmell(e.target.value)}
                    className="w-full p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                  >
                    <option>Heavy burning smell</option>
                    <option>Moderate sulfur smell</option>
                    <option>Mild smoke smell</option>
                    <option>None</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#4A6B56] block mb-1">Cracker Activity:</label>
                  <select
                    value={crackerActivity}
                    onChange={(e) => setCrackerActivity(e.target.value)}
                    className="w-full p-2 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                  >
                    <option>Continuous heavy bursts</option>
                    <option>Moderate activity</option>
                    <option>Low background activity</option>
                    <option>None</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#4A6B56] block mb-1">Observations &amp; Physical Symptoms:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe smoke density, eye burning, throat irritation, or specific nearby hotspots..."
                  className="w-full p-2.5 rounded border border-[#D1DFD4] bg-[#F8FAF8]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBF3EA]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#D1DFD4] rounded text-[#4A6B56] hover:bg-[#F8FAF8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#133E26] text-white rounded hover:bg-[#2D6A4F] font-semibold"
                >
                  {isSubmitting ? 'Scoring & Ingesting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
