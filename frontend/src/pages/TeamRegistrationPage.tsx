import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Document } from 'react-iconly';

import { TeamRegistrationSidebar } from './TeamRegistrationSidebar';
import { TeamRegistrationTeamInfo } from './TeamRegistrationTeamInfo';
import { TeamRegistrationSuccessView } from './TeamRegistrationSuccessView';
import { TeamRegistrationSquadBuilder } from './TeamRegistrationSquadBuilder';
import { useTeamRegistrationForm } from '../hooks/useTeamRegistrationForm';

export interface PlayerDraft {
  full_name: string;
  position: string;
  jersey_number: string;
  nationality: string;
  student_id: string;
  preferred_foot: string;
  photo_url: string;
  dob: string;
  course: string;
  medical_conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export const TeamRegistrationPage: React.FC = () => {
  const {
    formData, setFormData,
    players,
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
    handleLookup
  } = useTeamRegistrationForm();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-12 pb-16">
      
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-dark-border">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-dark-bg uppercase tracking-tight">
            TEAM <span className="text-gold text-glow">REGISTRATION</span>
          </h1>
          <p className="text-sm text-dark-muted mt-2">
            Official University Football Team & Athlete Squad Entry Portal for MIUCC 2026.
          </p>
        </div>

        <a
          href={api.getPublicTeamsExportPdfUrl()}
          target="_blank"
          rel="noreferrer"
          className="btn-outline text-xs flex items-center gap-2 shadow-md"
        >
          <Document set="bold" className="w-4 h-4" /> Download Team Listing (PDF)
        </a>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {submissionResult ? (
              <TeamRegistrationSuccessView submissionResult={submissionResult} />
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="glass-card p-6 sm:p-10 space-y-10"
              >
                <TeamRegistrationTeamInfo
                  formData={formData}
                  setFormData={setFormData}
                  errorMessage={errorMessage}
                />

                <TeamRegistrationSquadBuilder
                  players={players}
                  handleAddPlayer={handleAddPlayer}
                  handlePlayerChange={handlePlayerChange}
                  handleRemovePlayer={handleRemovePlayer}
                  handlePhotoFileUpload={handlePhotoFileUpload}
                  submitting={submitting}
                />
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6 lg:sticky lg:top-24 self-start">
          <TeamRegistrationSidebar
            players={players}
            searchRef={searchRef}
            setSearchRef={setSearchRef}
            handleLookup={handleLookup}
            searching={searching}
            lookupError={lookupError}
            lookupResult={lookupResult}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
