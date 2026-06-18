'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCarePlanStore, type MonitoredCarePlan } from '@/lib/stores/carePlanStore';
import { getAllPatients } from '@/lib/patientRegistry';
import { generateHolisticCarePlan } from '@/lib/services/carePlanGenerator';
import type { Patient, InterventionStatus } from '@/lib/mockData';

export default function CarePlanMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  
  const { getCarePlan, setCarePlan, updateActionStatus } = useCarePlanStore();
  const [plan, setPlan] = useState<MonitoredCarePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set([1, 2, 4]));

  useEffect(() => {
    // Find patient
    const allPatients = getAllPatients();
    const patient = allPatients.find((p: any) => p.platformId === patientId || p.id === patientId);
    if (!patient) {
      setLoading(false);
      return;
    }

    // Check if we have a care plan in store
    let carePlan = getCarePlan(patientId);
    
    // If not, generate one (for Maria)
    if (!carePlan && patient.name.toLowerCase().includes('maria')) {
      const generated = generateHolisticCarePlan({
        patient: patient as any,
        hccSuspects: [],
        careGaps: (patient.careGaps || []) as any,
        alerts: []
      });
      
      setCarePlan(patientId, generated as any);
      carePlan = getCarePlan(patientId);
    }
    
    setPlan(carePlan);
    setLoading(false);
  }, [patientId, getCarePlan, setCarePlan]);

  const toggleTier = (tier: number) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tier)) {
      newExpanded.delete(tier);
    } else {
      newExpanded.add(tier);
    }
    setExpandedTiers(newExpanded);
  };

  const handleStatusUpdate = (actionId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    // Map display status to InterventionStatus
    const statusMap: Record<string, InterventionStatus> = {
      'Pending': 'Pending',
      'In Progress': 'Active',
      'Completed': 'Scheduled' // Using Scheduled as proxy for completed
    };
    
    updateActionStatus(patientId, actionId, statusMap[newStatus]);
    // Refresh plan from store
    setPlan(getCarePlan(patientId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon-gray-10 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg text-carbon-gray-70">Loading care plan...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-carbon-gray-10 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold text-carbon-gray-100 mb-4">No Care Plan Found</h2>
            <p className="text-carbon-gray-70 mb-6">
              No active care plan exists for this patient.
            </p>
            <button
              onClick={() => router.push('/md-smart-launch')}
              className="px-6 py-2 bg-carbon-blue-60 text-white rounded hover:bg-carbon-blue-70"
            >
              Generate Care Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tierGoals = plan.goals.reduce((acc, goal) => {
    const tier = (goal as any).tier || 0;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(goal);
    return acc;
  }, {} as Record<number, typeof plan.goals>);

  const getTierStatus = (tier: number): 'completed' | 'in-progress' | 'pending' => {
    const progress = plan.tierProgress[tier] || 0;
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'pending';
  };

  const getTierIcon = (status: string) => {
    if (status === 'completed') return '✅';
    if (status === 'in-progress') return '🔄';
    return '⏳';
  };

  const getTierColor = (status: string) => {
    if (status === 'completed') return 'bg-green-50 border-green-200';
    if (status === 'in-progress') return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getTierPriority = (tier: number): string => {
    if (tier === 1) return 'CRITICAL';
    if (tier === 2 || tier === 4) return 'HIGH';
    return 'MODERATE';
  };

  const getTierTitle = (tier: number): string => {
    const titles: Record<number, string> = {
      1: 'Establish Respite Care',
      2: 'Coordinate Transportation for Clinical Care',
      3: 'Optimize Care Delivery',
      4: 'Close Clinical Care Gaps',
      5: 'Sustainability & Long-term Support'
    };
    return titles[tier] || `Tier ${tier}`;
  };

  return (
    <div className="min-h-screen bg-carbon-gray-10">
      {/* Header */}
      <div className="bg-white border-b border-carbon-gray-20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-carbon-blue-60 hover:text-carbon-blue-70 mb-2 flex items-center gap-2"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-semibold text-carbon-gray-100">
                Care Plan Monitor - {patientInfo?.name}
              </h1>
              <p className="text-sm text-carbon-gray-70 mt-1">
                Generated {new Date(plan.generatedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-carbon-blue-60">{plan.overallProgress}%</div>
                <div className="text-xs text-carbon-gray-70">Overall Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Root Cause Banner */}
        {plan.rootCauseInfo && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Root Cause: {plan.rootCauseInfo.type.replace('-', ' ').toUpperCase()}
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  {plan.rootCauseInfo.description}
                </p>
                {plan.rootCauseInfo.burdenScore && (
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-semibold">Burden Score:</span>{' '}
                      <span className="text-red-900">{plan.rootCauseInfo.burdenScore}/100</span>
                    </div>
                    {plan.rootCauseInfo.successProbability && (
                      <div>
                        <span className="font-semibold">Success Probability:</span>{' '}
                        <span className="text-green-700">{plan.rootCauseInfo.successProbability}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tiered Goals */}
        <div className="space-y-6">
          {Object.keys(tierGoals).sort((a, b) => Number(a) - Number(b)).map(tierKey => {
            const tier = Number(tierKey);
            const goals = tierGoals[tier];
            const status = getTierStatus(tier);
            const progress = plan.tierProgress[tier] || 0;
            const isExpanded = expandedTiers.has(tier);

            return (
              <div key={tier} className={`bg-white rounded-lg shadow-sm border-2 ${getTierColor(status)}`}>
                {/* Tier Header */}
                <button
                  onClick={() => toggleTier(tier)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getTierIcon(status)}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-carbon-gray-100">
                          Tier {tier}: {getTierTitle(tier)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          getTierPriority(tier) === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          getTierPriority(tier) === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getTierPriority(tier)}
                        </span>
                      </div>
                      <div className="text-sm text-carbon-gray-70 mt-1">
                        {goals.length} goal{goals.length !== 1 ? 's' : ''} • {progress}% complete
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          progress === 100 ? 'bg-green-500' :
                          progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-carbon-gray-70">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>

                {/* Tier Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6">
                    {goals.map(goal => (
                      <div key={goal.id} className="mb-6 last:mb-0">
                        <div className="mb-3">
                          <h4 className="font-semibold text-carbon-gray-100">{goal.description}</h4>
                          {goal.target && (
                            <p className="text-sm text-carbon-gray-70 mt-1">Target: {goal.target}</p>
                          )}
                        </div>

                        {/* Interventions/Actions */}
                        <div className="space-y-3 ml-4">
                          {goal.interventions?.map(intervention => (
                            <div
                              key={intervention.id}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200"
                            >
                              <div className="flex-shrink-0 mt-1">
                                {intervention.status === 'Scheduled' ? '✅' :
                                 intervention.status === 'Active' ? '🔄' : '⏳'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-carbon-gray-100">
                                  {intervention.description}
                                </div>
                                {intervention.provider && (
                                  <div className="text-xs text-carbon-gray-70 mt-1">
                                    Provider: {intervention.provider}
                                  </div>
                                )}
                                {intervention.scheduledDate && (
                                  <div className="text-xs text-carbon-gray-70">
                                    Scheduled: {intervention.scheduledDate}
                                  </div>
                                )}
                                {intervention.notes && (
                                  <div className="text-xs text-carbon-gray-70 mt-1 italic">
                                    Note: {intervention.notes}
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                {intervention.status !== 'Scheduled' && (
                                  <button
                                    onClick={() => handleStatusUpdate(intervention.id, 'Completed')}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Mark Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
