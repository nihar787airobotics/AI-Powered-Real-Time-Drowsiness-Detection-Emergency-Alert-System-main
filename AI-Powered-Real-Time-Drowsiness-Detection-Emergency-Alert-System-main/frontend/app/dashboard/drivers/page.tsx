'use client';

import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch drivers list
    const fetchDrivers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/drivers', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDrivers(data.drivers || []);
        }
      } catch (error) {
        console.log('[v0] Error fetching drivers:', error);
      }
    };

    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Drivers</h1>
          <p className="text-neutral-400">Manage and monitor your fleet drivers</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition">
          Add Driver
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-neutral-500" size={20} />
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Drivers Table */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700 bg-neutral-700/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-300">Driver</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-300">Vehicle</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-300">Drowsiness Avg</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-300">Hours Driven</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-neutral-700 hover:bg-neutral-700/30 transition">
                    <td className="px-6 py-3 text-sm text-foreground font-medium">{driver.name}</td>
                    <td className="px-6 py-3 text-sm text-neutral-400">{driver.vehicle_id}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        driver.status === 'online' ? 'bg-success/10 text-success' :
                        driver.status === 'idle' ? 'bg-warning/10 text-warning' :
                        'bg-neutral-700 text-neutral-400'
                      }`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-400">{driver.drowsiness_avg}%</td>
                    <td className="px-6 py-3 text-sm text-neutral-400">{driver.hours_driven}h</td>
                    <td className="px-6 py-3 text-sm">
                      <button className="text-primary hover:text-primary-dark transition">View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                    No drivers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
