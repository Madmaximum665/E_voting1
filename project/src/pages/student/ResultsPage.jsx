import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, AlertCircle, Trophy, Users, BarChart4 } from 'lucide-react';
import useElectionStore from '../../stores/electionStore';
import { useAuthStore } from '../../stores/authStore';

const ResultsPage = () => {
  const { id } = useParams();
  
  const { elections, loading, error, loadElections, fetchElectionDetails } = useElectionStore();
  const { user, users, loadUsers: loadAuthUsers, loading: authLoading } = useAuthStore();
  const [electionResult, setElectionResult] = useState(null);
  
  useEffect(() => {
    loadElections();
  }, [loadElections]);

  useEffect(() => {
    // For admins, load all users to calculate eligible voters accurately.
    // For students/others, this is not called to prevent 403 errors when fetching all users.
    if (user?.role === 'admin' && users.length === 0 && !authLoading) {
      loadAuthUsers().catch(error => {
        console.error("[ResultsPage] Admin failed to load users:", error);
      });
    }
  }, [user, loadAuthUsers, users.length, authLoading]);
  
  useEffect(() => {
    if (elections.length > 0 && id) {
      const election = elections.find(e => e.id === id);
      if (election) {
        // Calculate results
        const positionResults = election.positions.map(position => {
          const totalVotes = position.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
          
          const candidateResults = position.candidates
            .map(candidate => {
              // console.log('[ResultsPage] Processing candidate:', JSON.parse(JSON.stringify(candidate))); // Temporarily disable full log, enable if needed
              // Defensive check for problematic candidate data
              if (!candidate || typeof candidate.id === 'undefined' || typeof candidate.name === 'undefined' || typeof candidate.votes === 'undefined') {
                console.error('[ResultsPage] Problematic candidate data encountered (missing id, name, or votes):', candidate);
                return {
                  candidateId: candidate?.id || `unknown-${Math.random().toString(36).substring(7)}`,
                  candidateName: candidate?.name || 'Invalid Candidate Name',
                  votes: typeof candidate?.votes === 'number' ? candidate.votes : 0,
                  percentage: 0,
                };
              }
              // All required fields are present and of expected basic type (existence)
              return {
                candidateId: candidate.id,
                candidateName: candidate.name,
                votes: candidate.votes, // Assuming votes is a number if it exists
                percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
              };
            })
            .sort((a, b) => b.votes - a.votes); // Sort by votes in descending order
          
          return {
            positionId: position.id,
            positionTitle: position.title,
            candidates: candidateResults,
            totalVotes,
          };
        });
        
        // Calculate total votes across all positions
        const totalVotesAcrossPositions = positionResults.reduce((sum, position) => sum + position.totalVotes, 0);
        
        // Determine eligible voters display value and numeric count for calculations
        let eligibleVotersDisplayValue;
        let numericEligibleVotersForCalc = 0;

        if (user?.role === 'admin') {
            // Admin: Calculate from the full, approved student list
            const adminCalculatedEligibleVoters = Array.isArray(users) ? users.filter(u => u.role === 'student' && u.approved === true).length : 0;
            eligibleVotersDisplayValue = adminCalculatedEligibleVoters;
            numericEligibleVotersForCalc = adminCalculatedEligibleVoters;
        } else {
            // Student/Other: Try to use a pre-calculated value from the election object.
            const backendProvidedCount = election.eligibleVoterCount || election.totalEligibleVoters;
            if (typeof backendProvidedCount === 'number') {
                eligibleVotersDisplayValue = backendProvidedCount;
                numericEligibleVotersForCalc = backendProvidedCount;
            } else {
                // Backend did not provide a count, or it wasn't a number
                eligibleVotersDisplayValue = "N/A";
                numericEligibleVotersForCalc = 0; // Use 0 for turnout calculation if N/A, effectively making turnout N/A too if numPositions > 0
                console.warn(`[ResultsPage] Election data for ID '${id}' does not contain a numeric 'eligibleVoterCount' or 'totalEligibleVoters' for non-admin user. Eligible voters display will be 'N/A'.`);
            }
        }

        // Calculate voter turnout
        let voterTurnoutDisplayValue;
        const numPositions = election.positions?.length || 0;
        if (eligibleVotersDisplayValue === "N/A" || numPositions === 0) {
            voterTurnoutDisplayValue = "N/A";
        } else {
            // numericEligibleVotersForCalc would be 0 if eligibleVotersDisplayValue was N/A and numPositions > 0, leading to turnout 0 or N/A. Let's ensure it's N/A.
            if (numericEligibleVotersForCalc === 0 && eligibleVotersDisplayValue === "N/A") { // Defensive, already covered by outer if
                voterTurnoutDisplayValue = "N/A";
            } else if (numericEligibleVotersForCalc === 0) { // e.g. admin sees 0 eligible voters
                 voterTurnoutDisplayValue = 0;
            }else {
                const maxPossibleVotes = numericEligibleVotersForCalc * numPositions;
                voterTurnoutDisplayValue = maxPossibleVotes > 0 ? Math.min((totalVotesAcrossPositions / maxPossibleVotes) * 100, 100) : 0;
            }
        }
        
        setElectionResult({
          electionId: election.id,
          positions: positionResults,
          totalVotes: totalVotesAcrossPositions,
          voterTurnout: voterTurnoutDisplayValue,
          eligibleVoters: eligibleVotersDisplayValue,
        });
      }
    }
  }, [elections, id, users, user]);

  useEffect(() => {
    if (!id || !fetchElectionDetails) return;

    // Fetch initial data immediately
    fetchElectionDetails(id).catch(err => {
      console.error("[ResultsPage] Initial fetchElectionDetails failed:", err);
      // Optionally set a local error state here if needed for the user
    });

    const POLLING_INTERVAL = 5000; // 5 seconds
    const intervalId = setInterval(() => {
      fetchElectionDetails(id).catch(err => {
        console.error("[ResultsPage] Polling fetchElectionDetails failed:", err);
        // Optionally handle repeated errors, e.g., stop polling after N failures or show a persistent error
      });
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [id, fetchElectionDetails]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading election results</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const election = elections.find(e => e.id === id);
  
  if (!election) {
    return (
      <div className="card flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Election not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The election you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/dashboard" className="mt-6 btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <div>
      <div className="mb-1">
        <Link to="/dashboard" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1 transform rotate-180" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Results for: {election.title}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Election held from {formatDate(election.startDate)} to {formatDate(election.endDate)}
        </p>
      </div>
      
      {!electionResult && !loading && (
        <div className="card flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Results not yet available</h3>
          <p className="mt-2 text-sm text-gray-500">
            The results for this election are still being processed or are not yet published.
          </p>
        </div>
      )}
      
      {electionResult && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Votes Cast</p>
                  <p className="text-2xl font-bold text-gray-900">{electionResult.totalVotes}</p>
                  <p className="text-xs text-gray-500">
                    {electionResult.eligibleVoters} eligible voters
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <BarChart4 className="h-8 w-8 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Voter Turnout</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof electionResult.voterTurnout === 'number' ? `${electionResult.voterTurnout.toFixed(1)}%` : electionResult.voterTurnout}
                  </p>
                  <p className="text-xs text-gray-500">
                    Based on {electionResult.eligibleVoters} eligible voters × {election.positions.length} positions
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-primary-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Positions</p>
                  <p className="text-2xl font-bold text-gray-900">{election.positions.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results by Position */}
          <div className="space-y-6">
            {electionResult.positions.map(position => (
              <div key={position.positionId} className="card animate-slideUp">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{position.positionTitle}</h2>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Total votes: {position.totalVotes}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {position.candidates.map((candidate, index) => {
                    const isWinner = index === 0 && candidate.votes > 0;
                    
                    return (
                      <div 
                        key={candidate.candidateId} 
                        className={`p-4 rounded-lg ${isWinner ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {isWinner && <Trophy className="h-5 w-5 text-primary-600 mr-2" />}
                            <h3 className={`font-medium ${isWinner ? 'text-primary-900' : 'text-gray-900'}`}>
                              {candidate.candidateName}
                            </h3>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${isWinner ? 'text-primary-700' : 'text-gray-700'}`}>
                              {candidate.votes}
                            </span>
                            <span className={`ml-1 text-sm ${isWinner ? 'text-primary-600' : 'text-gray-500'}`}>
                              ({candidate.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2 relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{ width: `${candidate.percentage}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isWinner ? 'bg-primary-500' : 'bg-gray-400'}`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {position.candidates.length === 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-500">No candidates for this position</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsPage;
