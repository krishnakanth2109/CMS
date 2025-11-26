import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs, Job } from "@/contexts/JobsContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  LinkIcon,
  ClipboardDocumentListIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  CodeBracketIcon,
  ClockIcon,
  EyeIcon,
  UserGroupIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// 🎨 Enhanced TAT Badge Generator
const getTatBadge = (tatTime?: string) => {
  if (!tatTime)
    return (
      <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 flex items-center gap-1.5">
        <ClockIcon className="w-4 h-4" />
        N/A
      </span>
    );

  const today = new Date();
  const tatDate = new Date(tatTime);
  const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0)
    return (
      <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1.5">
        <ExclamationTriangleIcon className="w-4 h-4" />
        Expired ({Math.abs(diffDays)}d)
      </span>
    );
  else if (diffDays === 0)
    return (
      <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1.5">
        <ExclamationTriangleIcon className="w-4 h-4" />
        Due Today
      </span>
    );
  else if (diffDays <= 3)
    return (
      <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 flex items-center gap-1.5">
        <ClockIcon className="w-4 h-4" />
        Due in {diffDays}d
      </span>
    );

  return (
    <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center gap-1.5">
      <CheckCircleIcon className="w-4 h-4" />
      {diffDays} days left
    </span>
  );
};

// 🎯 Priority Badge
const getPriorityBadge = (tatTime?: string) => {
  if (!tatTime) return null;

  const today = new Date();
  const tatDate = new Date(tatTime);
  const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0)
    return <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="High Priority - Expired"></span>;
  else if (diffDays <= 1)
    return <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="High Priority"></span>;
  else if (diffDays <= 3)
    return <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Medium Priority"></span>;
  else
    return <span className="w-2 h-2 bg-green-500 rounded-full" title="Low Priority"></span>;
};

// 🔹 Sort Configuration
interface SortConfig {
  key: keyof Job;
  direction: "asc" | "desc";
}

// 🔹 View Types
type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "expired" | "urgent" | "safe";

// 🔹 Enhanced Job Detail Card Component
const JobDetailCard: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl relative">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getPriorityBadge(job.tatTime)}
                  <h2 className="text-2xl font-bold">{job.position || "N/A"}</h2>
                </div>
                <div className="flex items-center gap-2 text-blue-100 mb-1">
                  <BuildingOfficeIcon className="w-5 h-5" />
                  <span className="text-lg font-medium">{job.client || "N/A"}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
                    📍 {job.location || "Remote"}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
                    💼 {job.experience || "Not specified"}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
                    💰 {job.salaryBudget || "Not specified"}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
                    🆔 {job.jobCode || "N/A"}
                  </span>
                  {job.tatTime && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
                      ⏰ {new Date(job.tatTime).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Recruiters Section */}
            {(job.primaryRecruiter || job.secondaryRecruiter) && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-purple-100 dark:border-gray-600">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  <UserGroupIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Assigned Recruiters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {job.primaryRecruiter && (
                    <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Primary Recruiter</span>
                        <span className="font-medium text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                          {job.primaryRecruiter}
                        </span>
                      </div>
                    </div>
                  )}
                  {job.secondaryRecruiter && (
                    <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Secondary Recruiter</span>
                        <span className="font-medium text-gray-900 dark:text-white bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                          {job.secondaryRecruiter}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-blue-100 dark:border-gray-600">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Basic Information
                  </h3>
                  <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Job Code</span>
                      <span className="font-medium text-gray-900 dark:text-white font-mono">{job.jobCode || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Client</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.client || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Position</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.position || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Experience</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.experience || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-green-100 dark:border-gray-600">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    <CodeBracketIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Required Skills
                  </h3>
                  <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {job.skills || "No specific skills mentioned"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Assignment & Timeline */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-purple-100 dark:border-gray-600">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    <CalendarDaysIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Assignment & Timeline
                  </h3>
                  <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">TAT Status</span>
                      <div>{getTatBadge(job.tatTime)}</div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Gender</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.gender || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Interview Mode</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.interviewMode || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Date Created</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {job.date ? new Date(job.date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compensation & Location */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-yellow-100 dark:border-gray-600">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    <CurrencyDollarIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Compensation & Location
                  </h3>
                  <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Salary Budget</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.salaryBudget || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 dark:text-gray-400">Location</span>
                      <span className="font-medium text-gray-900 dark:text-white">{job.location || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAT Details */}
            {job.tatTime && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-red-100 dark:border-gray-600">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  <ClockIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Turnaround Time Details
                </h3>
                <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 dark:text-gray-400">Target Completion Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(job.tatTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                    <div>{getTatBadge(job.tatTime)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents & Comments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* JD Link */}
              {job.jdLink && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-indigo-100 dark:border-gray-600">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Job Description
                  </h3>
                  <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <a
                      href={job.jdLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 w-full justify-center font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <LinkIcon className="w-4 h-4" />
                      View Job Description Document
                    </a>
                  </div>
                </div>
              )}

              {/* Comments */}
              {job.comments && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-4 border border-orange-100 dark:border-gray-600">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    Additional Comments
                  </h3>
                  <div className="bg-white dark:bg-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{job.comments}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Created on: {job.date ? new Date(job.date).toLocaleDateString() : "N/A"}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Close Details
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 🎨 Grid View Card Component
const JobGridCard: React.FC<{ job: Job; onView: (job: Job) => void; userRole: (job: Job) => React.ReactNode }> = ({ 
  job, 
  onView, 
  userRole 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group hover:transform hover:-translate-y-2"
    >
      {/* Priority Indicator */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {getPriorityBadge(job.tatTime)}
            <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              {job.jobCode}
            </span>
          </div>
          {userRole(job)}
        </div>

        {/* Client & Position */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{job.client}</h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <BriefcaseIcon className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">{job.position}</h4>
          </div>
        </div>

        {/* Skills Preview */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2" title={job.skills}>
            {job.skills || "No specific skills mentioned"}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{job.location || "Remote"}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{job.experience || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{job.salaryBudget || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {job.date ? new Date(job.date).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>

        {/* TAT Status */}
        <div className="mb-4">
          {getTatBadge(job.tatTime)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(job)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <EyeIcon className="w-4 h-4" />
            View Details
          </button>
          {job.jdLink && (
            <a
              href={job.jdLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 hover:bg-gray-700 text-white p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              title="View JD"
            >
              <LinkIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const RecruiterAssignments: React.FC = () => {
  const { user } = useAuth();
  const { jobs } = useJobs();

  // State management
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "primary" | "secondary">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter jobs for current user
  const myJobs = useMemo(() => {
    if (!user?.name) return [];
    return jobs.filter(job => 
      job.primaryRecruiter === user.name || job.secondaryRecruiter === user.name
    );
  }, [jobs, user?.name]);

  // Enhanced filtering and searching
  const filteredJobs = useMemo(() => {
    const filtered = myJobs.filter(job => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        job.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = (() => {
        if (!job.tatTime) return statusFilter === "all";
        
        const today = new Date();
        const tatDate = new Date(job.tatTime);
        const diffDays = Math.ceil((tatDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        switch (statusFilter) {
          case "active": return diffDays >= 0;
          case "expired": return diffDays < 0;
          case "urgent": return diffDays >= 0 && diffDays <= 3;
          case "safe": return diffDays > 3;
          default: return true;
        }
      })();

      // Role filter
      const matchesRole = 
        roleFilter === "all" ||
        (roleFilter === "primary" && job.primaryRecruiter === user?.name) ||
        (roleFilter === "secondary" && job.secondaryRecruiter === user?.name);

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (sortConfig.key === "salaryBudget") {
          const numA = parseFloat((aVal as string).replace(/[^0-9.]/g, "")) || 0;
          const numB = parseFloat((bVal as string).replace(/[^0-9.]/g, "")) || 0;
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        if (sortConfig.key === "tatTime" || sortConfig.key === "date") {
          const dateA = new Date(aVal as string).getTime();
          const dateB = new Date(bVal as string).getTime();
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return 0;
      });
    }
    return filtered;
  }, [myJobs, sortConfig, searchQuery, statusFilter, roleFilter, user?.name]);

  // Handlers
  const handleSort = (key: keyof Job) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  // Get role badge for current user
  const getUserRoleBadge = (job: Job) => {
    if (job.primaryRecruiter === user?.name) {
      return (
        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
          <UserIcon className="w-4 h-4" />
          Primary
        </span>
      );
    } else if (job.secondaryRecruiter === user?.name) {
      return (
        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center gap-1.5">
          <UserGroupIcon className="w-4 h-4" />
          Secondary
        </span>
      );
    }
    return null;
  };

  // Stats
  const stats = useMemo(() => {
    const total = myJobs.length;
    const primary = myJobs.filter(job => job.primaryRecruiter === user?.name).length;
    const secondary = myJobs.filter(job => job.secondaryRecruiter === user?.name).length;
    
    const urgent = myJobs.filter(job => {
      if (!job.tatTime) return false;
      const diffDays = Math.ceil((new Date(job.tatTime).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    const expired = myJobs.filter(job => {
      if (!job.tatTime) return false;
      const diffDays = Math.ceil((new Date(job.tatTime).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return diffDays < 0;
    }).length;

    return { total, primary, secondary, urgent, expired };
  }, [myJobs, user?.name]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-700 text-gray-900 dark:text-gray-100">
      <DashboardSidebar />

      <div className="flex-1 p-6 sm:p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 dark:from-white dark:via-gray-400 dark:to-white mb-2">
                  My Assigned Jobs
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {/* View Controls */}
              <div className="flex flex-wrap gap-3">
                {/* View Mode Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700 flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "list" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                    showFilters
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500"
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  <span className="font-medium">Filters</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Jobs</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <BriefcaseIcon className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Primary</p>
                    <p className="text-2xl font-bold">{stats.primary}</p>
                  </div>
                  <UserIcon className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Secondary</p>
                    <p className="text-2xl font-bold">{stats.secondary}</p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Urgent</p>
                    <p className="text-2xl font-bold">{stats.urgent}</p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Expired</p>
                    <p className="text-2xl font-bold">{stats.expired}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-red-200" />
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by position, client, skills, or job code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          TAT Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="urgent">Urgent (≤3 days)</option>
                          <option value="safe">Safe {'>'}3 days</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>

                      {/* Role Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          My Role
                        </label>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value as "all" | "primary" | "secondary")}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                          <option value="all">All Roles</option>
                          <option value="primary">Primary Only</option>
                          <option value="secondary">Secondary Only</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sort By
                        </label>
                        <select
                          value={sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : ""}
                          onChange={(e) => {
                            const [key, direction] = e.target.value.split("-");
                            if (key) {
                              setSortConfig({ key: key as keyof Job, direction: direction as "asc" | "desc" });
                            } else {
                              setSortConfig(null);
                            }
                          }}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                          <option value="">Default</option>
                          <option value="tatTime-asc">TAT: Earliest First</option>
                          <option value="tatTime-desc">TAT: Latest First</option>
                          <option value="salaryBudget-desc">Salary: High to Low</option>
                          <option value="salaryBudget-asc">Salary: Low to High</option>
                          <option value="date-desc">Date: Newest First</option>
                          <option value="date-asc">Date: Oldest First</option>
                        </select>
                      </div>

                      {/* Clear Filters */}
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setRoleFilter("all");
                            setSortConfig(null);
                          }}
                          className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Jobs Display */}
          {filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center mt-32 space-y-6 text-center"
            >
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <BriefcaseIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  {myJobs.length === 0 
                    ? "No jobs have been assigned to you yet. Jobs will appear here when an admin assigns you as Primary or Secondary Recruiter."
                    : "No jobs match your current filters. Try adjusting your search or filters."}
                </p>
              </div>
            </motion.div>
          ) : viewMode === "grid" ? (
            // Grid View
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredJobs.map((job, index) => (
                <JobGridCard
                  key={job.id}
                  job={job}
                  onView={handleJobClick}
                  userRole={getUserRoleBadge}
                />
              ))}
            </motion.div>
          ) : (
            // List View
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
            >
              {/* Table Header */}
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-blue-600 dark:via-indigo-500 dark:to-blue-600 text-white px-6 py-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold min-w-[1200px]">
                  <div className="col-span-1 text-center">#</div>
                  <div 
                    className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition"
                    onClick={() => handleSort("jobCode" as keyof Job)}
                  >
                    Job Code
                    <ChevronUpDownIcon className="w-4 h-4 opacity-70" />
                  </div>
                  <div
                    className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition"
                    onClick={() => handleSort("client" as keyof Job)}
                  >
                    Client
                    <ChevronUpDownIcon className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="col-span-2">Position</div>
                  <div className="col-span-2">Skills</div>
                  <div className="col-span-1">Location</div>
                  <div className="col-span-1">Experience</div>
                  <div 
                    className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition"
                    onClick={() => handleSort("salaryBudget" as keyof Job)}
                  >
                    Salary
                    <ChevronUpDownIcon className="w-4 h-4 opacity-70" />
                  </div>
                  <div 
                    className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition"
                    onClick={() => handleSort("tatTime" as keyof Job)}
                  >
                    TAT
                    <ChevronUpDownIcon className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="col-span-1">My Role</div>
                  <div className="col-span-1 text-center">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700 min-w-[1200px]">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200 ${
                      index % 2 === 0
                        ? "bg-gray-50/50 dark:bg-gray-900/40"
                        : "bg-white dark:bg-gray-800/40"
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      {/* Index */}
                      <div className="col-span-1 text-center text-gray-500 font-medium">
                        {index + 1}
                      </div>

                      {/* Job Code */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(job.tatTime)}
                          <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-center block">
                            {job.jobCode || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {job.client || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Position */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <BriefcaseIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {job.position || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="col-span-2">
                        <p className="text-gray-600 dark:text-gray-400 truncate" title={job.skills || ""}>
                          {job.skills || "N/A"}
                        </p>
                      </div>

                      {/* Location */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {job.location || "Remote"}
                          </span>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="col-span-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {job.experience || "N/A"}
                        </span>
                      </div>

                      {/* Salary */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {job.salaryBudget || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* TAT */}
                      <div className="col-span-1">
                        {getTatBadge(job.tatTime)}
                      </div>

                      {/* My Role */}
                      <div className="col-span-1">
                        {getUserRoleBadge(job)}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-center space-x-2">
                        <button
                          onClick={() => handleJobClick(job)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {job.jdLink && (
                          <a
                            href={job.jdLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            title="View JD"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Job Detail Card Modal */}
      {selectedJob && (
        <JobDetailCard job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
};

export default RecruiterAssignments;