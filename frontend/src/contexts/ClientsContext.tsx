// contexts/ClientsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  locationLink: string;
  industry: string;
  gstNumber?: string;
  notes: string;
  dateAdded: string;
  clientId?: string;
  percentage?: number;
  candidatePeriod?: number;
  replacementPeriod?: number;
  terms?: string;
  active?: boolean;
}

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'dateAdded'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientByName: (name: string) => Client | undefined;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);

  // Load clients from localStorage on mount
  useEffect(() => {
    const savedClients = localStorage.getItem('recruiterHub_clients');
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
  }, []);

  // Save clients to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem('recruiterHub_clients', JSON.stringify(clients));
  }, [clients]);

  const addClient = (clientData: Omit<Client, 'id' | 'dateAdded'>) => {
    const newClient: Client = {
      ...clientData,
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: new Date().toISOString(),
    };
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...clientData } : client
    ));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  const getClientByName = (name: string) => {
    return clients.find(client => client.companyName === name);
  };

  return (
    <ClientsContext.Provider value={{
      clients,
      addClient,
      updateClient,
      deleteClient,
      getClientByName
    }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};