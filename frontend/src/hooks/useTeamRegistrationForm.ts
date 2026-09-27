import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { PlayerDraft } from '../pages/TeamRegistrationPage';

export const useTeamRegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    country: '', // Will be set by manager profile
    coach_name: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '+91 ',
    description: '',
    logo_url: ''
  });
  
  const [managerLoaded, setManagerLoaded] = useState(false);
  const [players, setPlayers] = useState<PlayerDraft[]>([
    {
      full_name: '',
      position: 'Forward',
      jersey_number: '10',
      nationality: 'Liberia',
      student_id: '',
      preferred_foot: 'Right',
      photo_url: '',
      dob: '',
      course: '',
      medical_conditions: '',
      emergency_contact_name: '',
      emergency_contact_phone: '+91 '
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchRef, setSearchRef] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadManager() {
      try {
        const token = localStorage.getItem('miucc_manager_token');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/manager/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.manager?.nation?.name) {
            setFormData(prev => ({ ...prev, country: data.manager.nation.name }));
            setPlayers(prev => prev.map(p => ({ ...p, nationality: data.manager.nation.name })));
          }
        }
        
        try {
          const teamRes = await api.getManagerTeam();
          if (teamRes.team) {
            navigate('/manager');
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error(err);
      } finally {
        setManagerLoaded(true);
      }
    }
    loadManager();
  }, [navigate]);

  const handlePhotoFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Player photo file size must be less than 5MB.');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        handlePlayerChange(index, 'photo_url', res.url);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPlayer = () => {
    setPlayers([
      ...players,
      {
        full_name: '',
        position: 'Midfielder',
        jersey_number: (players.length + 1).toString(),
        nationality: formData.country,
        student_id: '',
        preferred_foot: 'Right',
        photo_url: '',
        dob: '',
        course: '',
        medical_conditions: '',
        emergency_contact_name: '',
        emergency_contact_phone: '+91 '
      }
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length === 1) return;
    setPlayers(players.filter((_, idx) => idx !== index));
  };

  const handlePlayerChange = (index: number, field: keyof PlayerDraft, value: string) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validPlayers = players.filter(p => p.full_name.trim() !== '');
    if (validPlayers.length === 0) {
      setErrorMessage('Please add at least 1 player to your team squad roster.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.registerTeam({
        ...formData,
        players: validPlayers
      });
      setSubmissionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit team registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setLookupError('');
    setSearching(true);

    try {
      const data = await api.checkTeamStatus(searchRef.trim());
      setLookupResult(data);
    } catch (err: any) {
      setLookupError(err.message || 'Registration reference code not found.');
      setLookupResult(null);
    } finally {
      setSearching(false);
    }
  };

  return {
    formData, setFormData,
    players, setPlayers,
    submitting,
    submissionResult,
    errorMessage,
    searchRef, setSearchRef,
    lookupResult,
    lookupError,
    searching,
    handlePhotoFileUpload,
    handleAddPlayer,
    handleRemovePlayer,
    handlePlayerChange,
    handleSubmit,
    handleLookup,
    managerLoaded
  };
};
