import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Candidate, CandidateStatus, Recruiter } from '@/types';
import { initialCandidates, sampleRecruiters } from '@/data/sampleData';

export type CandidateInput = Omit<Candidate, 'id' | 'candidateId'>;
export type UpdateCandidate = Partial<Omit<Candidate, 'id' | 'candidateId'>>;

// Generate unique ID safely
const uuid = () => crypto.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;

// Generate human-readable candidate ID
const generateCandidateId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CAN-${timestamp}-${random}`;
};

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Notification {
  id: string;
  to: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}


interface DataContextType {
  candidates: Candidate[];
  recruiters: Recruiter[];
  setRecruiters: React.Dispatch<React.SetStateAction<Recruiter[]>>;
  messages: Message[];
  notifications: Notification[];
  addCandidate: (candidate: CandidateInput) => void;
  updateCandidate: (id: string, updates: UpdateCandidate) => void;
  deleteCandidate: (id: string) => void;
  updateRecruiter: (id: string, updates: Partial<Recruiter>) => void;
  sendMessage: (message: Omit<Message, 'id' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  updateCandidateStatus: (id: string, status: CandidateStatus) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>(sampleRecruiters || []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'admin',
      to: 'sandeep',
      subject: 'Welcome to RecruiterHub',
      content: 'Welcome to the team! Please review the new hiring guidelines.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      to: 'sandeep',
      type: 'info',
      title: 'New System Update',
      message: 'The system has been updated with new features. Check them out!',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]);

  // Load candidates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('candidates');
      if (saved) {
        const parsedCandidates = JSON.parse(saved);
        
        // Ensure all candidates have candidateId
        const updatedCandidates = parsedCandidates.map((candidate: Candidate) => ({
          ...candidate,
          candidateId: candidate.candidateId || generateCandidateId(),
        }));
        
        setCandidates(updatedCandidates);
        localStorage.setItem('candidates', JSON.stringify(updatedCandidates));
      } else {
        // Add candidateId to initial candidates
        const initialCandidatesWithIds = initialCandidates.map(candidate => ({
          ...candidate,
          candidateId: generateCandidateId(),
        }));
        
        setCandidates(initialCandidatesWithIds);
        localStorage.setItem('candidates', JSON.stringify(initialCandidatesWithIds));
      }
    } catch (err) {
      console.error("Error loading saved candidates:", err);
      
      // Add candidateId to initial candidates as fallback
      const initialCandidatesWithIds = initialCandidates.map(candidate => ({
        ...candidate,
        candidateId: generateCandidateId(),
      }));
      
      setCandidates(initialCandidatesWithIds);
    }
  }, []);

  // Add Candidate function
  const addCandidate = (candidateData: CandidateInput) => {
    try {
      console.log('Adding candidate with data:', candidateData);

      const newCandidate: Candidate = {
        ...candidateData,
        id: uuid(),
        candidateId: generateCandidateId(),
        skills: Array.isArray(candidateData.skills) 
          ? candidateData.skills 
          : typeof candidateData.skills === 'string'
            ? candidateData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
            : [],
        createdAt: candidateData.createdAt || new Date().toISOString().split('T')[0],
      };

      console.log('Created new candidate:', newCandidate);

      setCandidates(prevCandidates => {
        const updatedCandidates = [...prevCandidates, newCandidate];
        localStorage.setItem('candidates', JSON.stringify(updatedCandidates));
        console.log('Candidates after add:', updatedCandidates);
        return updatedCandidates;
      });

    } catch (error) {
      console.error('Error in addCandidate:', error);
      throw error;
    }
  };

  // Update Candidate function
  const updateCandidate = (id: string, updates: UpdateCandidate) => {
    try {
      setCandidates(prevCandidates => {
        const updatedCandidates = prevCandidates.map((candidate) =>
          candidate.id === id
            ? {
                ...candidate,
                ...updates,
                skills: updates.skills
                  ? (Array.isArray(updates.skills)
                      ? updates.skills
                      : (typeof updates.skills === 'string'
                          ? updates.skills.split(',').map((s) => s.trim()).filter(s => s !== '')
                          : candidate.skills))
                  : candidate.skills,
              }
            : candidate
        );

        localStorage.setItem('candidates', JSON.stringify(updatedCandidates));
        return updatedCandidates;
      });
    } catch (error) {
      console.error('Error in updateCandidate:', error);
      throw error;
    }
  };

  // Delete Candidate function
  const deleteCandidate = (id: string) => {
    try {
      setCandidates(prevCandidates => {
        const updatedCandidates = prevCandidates.filter((candidate) => candidate.id !== id);
        localStorage.setItem('candidates', JSON.stringify(updatedCandidates));
        return updatedCandidates;
      });
    } catch (error) {
      console.error('Error in deleteCandidate:', error);
      throw error;
    }
  };

  const updateCandidateStatus = (id: string, status: CandidateStatus) => {
    updateCandidate(id, { status });
  };

  const updateRecruiter = (id: string, updates: Partial<Recruiter>) => {
    setRecruiters(prevRecruiters =>
      prevRecruiters.map(recruiter =>
        recruiter.id === id ? { ...recruiter, ...updates } : recruiter
      )
    );
  };

  // Messaging + Notifications
  const sendMessage = (message: Omit<Message, 'id' | 'read'>) => {
    const newMessage: Message = {
      ...message,
      id: uuid(),
      read: false,
    };
    setMessages((prev) => [newMessage, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        candidates,
        recruiters,
        setRecruiters,
        messages,
        notifications,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        updateRecruiter,
        sendMessage,
        markNotificationAsRead,
        deleteNotification,
        updateCandidateStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}