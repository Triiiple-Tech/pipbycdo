import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  X, 
  CheckSquare, 
  Square, 
  Folder,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

export interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled' | 'planning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  manager: string;
  team: string[];
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  department: string;
  tags: string[];
}

export interface ProjectFilterProps {
  projects: Project[];
  selectedProjects: string[];
  onChange: (projectIds: string[]) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  maxSelections?: number;
  showProjectDetails?: boolean;
}

// Mock project data for development
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce Platform Redesign',
    code: 'ECPR-2024',
    status: 'active',
    priority: 'high',
    manager: 'Sarah Johnson',
    team: ['John Doe', 'Jane Smith', 'Mike Wilson'],
    budget: 150000,
    spent: 89500,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    progress: 68,
    department: 'Digital',
    tags: ['frontend', 'ui/ux', 'mobile-first']
  },
  {
    id: 'proj-2',
    name: 'AI Customer Support Integration',
    code: 'AICS-2024',
    status: 'active',
    priority: 'critical',
    manager: 'David Chen',
    team: ['Emily Davis', 'Alex Rodriguez', 'Lisa Park'],
    budget: 200000,
    spent: 145000,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-15'),
    progress: 45,
    department: 'Technology',
    tags: ['ai', 'nlp', 'automation']
  },
  {
    id: 'proj-3',
    name: 'Brand Identity Refresh',
    code: 'BIR-2024',
    status: 'completed',
    priority: 'medium',
    manager: 'Maria Garcia',
    team: ['Tom Brown', 'Anna Lee'],
    budget: 75000,
    spent: 72500,
    startDate: new Date('2023-11-01'),
    endDate: new Date('2024-02-28'),
    progress: 100,
    department: 'Marketing',
    tags: ['branding', 'design', 'guidelines']
  },
  {
    id: 'proj-4',
    name: 'Data Analytics Dashboard',
    code: 'DAD-2024',
    status: 'planning',
    priority: 'medium',
    manager: 'Robert Kim',
    team: ['Susan White', 'James Taylor'],
    budget: 120000,
    spent: 15000,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-09-30'),
    progress: 12,
    department: 'Analytics',
    tags: ['dashboard', 'visualization', 'reporting']
  },
  {
    id: 'proj-5',
    name: 'Mobile App Development',
    code: 'MAD-2024',
    status: 'on_hold',
    priority: 'low',
    manager: 'Jennifer Lopez',
    team: ['Kevin Zhang', 'Rachel Green'],
    budget: 180000,
    spent: 45000,
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-10-31'),
    progress: 25,
    department: 'Mobile',
    tags: ['mobile', 'ios', 'android']
  }
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: Clock },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckSquare },
  on_hold: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: X },
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-800', icon: Calendar }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-600' }
};

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  projects = MOCK_PROJECTS,
  selectedProjects,
  onChange,
  className,
  disabled = false,
  placeholder = 'Select projects',
  maxSelections,
  showProjectDetails = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string[]>([]);

  // Get unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.department))).sort();
  }, [projects]);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !searchTerm || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.manager.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(project.status);
      const matchesPriority = filterPriority.length === 0 || filterPriority.includes(project.priority);
      const matchesDepartment = filterDepartment.length === 0 || filterDepartment.includes(project.department);

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
    });
  }, [projects, searchTerm, filterStatus, filterPriority, filterDepartment]);

  // Get selected project names for display
  const getDisplayText = () => {
    if (selectedProjects.length === 0) return placeholder;
    if (selectedProjects.length === 1) {
      const project = projects.find(p => p.id === selectedProjects[0]);
      return project?.name || 'Unknown Project';
    }
    return `${selectedProjects.length} projects selected`;
  };

  // Handle project selection
  const handleProjectToggle = (projectId: string) => {
    const isSelected = selectedProjects.includes(projectId);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedProjects.filter(id => id !== projectId);
    } else {
      if (maxSelections && selectedProjects.length >= maxSelections) {
        return; // Don't allow more selections
      }
      newSelection = [...selectedProjects, projectId];
    }

    onChange(newSelection);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      onChange([]);
    } else {
      const allIds = filteredProjects.map(p => p.id);
      onChange(maxSelections ? allIds.slice(0, maxSelections) : allIds);
    }
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Toggle filter
  const toggleFilter = (filterArray: string[], setFilter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(f => f !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full justify-between text-left font-normal',
          'border-gray-200 hover:border-[#E60023] focus:border-[#E60023]',
          'transition-all duration-200',
          selectedProjects.length === 0 && 'text-gray-500'
        )}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
          {selectedProjects.length > 0 && (
            <Badge variant="secondary" className="bg-[#E60023] text-white text-xs">
              {selectedProjects.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {selectedProjects.length > 0 && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-[#E60023] transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="p-4 shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm max-h-96 overflow-hidden flex flex-col">
              {/* Search and Controls */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm border-gray-200 focus:border-[#E60023]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs hover:bg-gray-50"
                  >
                    {selectedProjects.length === filteredProjects.length ? 'Clear All' : 'Select All'}
                  </Button>
                  <span className="text-xs text-gray-500">
                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                    {maxSelections && ` (max ${maxSelections})`}
                  </span>
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <Button
                          key={status}
                          variant={filterStatus.includes(status) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleFilter(filterStatus, setFilterStatus, status)}
                          className={cn(
                            'text-xs h-6',
                            filterStatus.includes(status)
                              ? 'bg-[#E60023] hover:bg-[#CC001F] text-white'
                              : 'hover:border-[#E60023]'
                          )}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Department</label>
                    <div className="flex flex-wrap gap-1">
                      {departments.map(dept => (
                        <Button
                          key={dept}
                          variant={filterDepartment.includes(dept) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleFilter(filterDepartment, setFilterDepartment, dept)}
                          className={cn(
                            'text-xs h-6',
                            filterDepartment.includes(dept)
                              ? 'bg-[#E60023] hover:bg-[#CC001F] text-white'
                              : 'hover:border-[#E60023]'
                          )}
                        >
                          {dept}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjects.includes(project.id);
                  const statusConfig = STATUS_CONFIG[project.status];
                  const priorityConfig = PRIORITY_CONFIG[project.priority];

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                        'hover:border-[#E60023] hover:shadow-sm',
                        isSelected
                          ? 'border-[#E60023] bg-[#E60023]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      )}
                      onClick={() => handleProjectToggle(project.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#E60023]" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {project.name}
                            </h4>
                            <Badge className={cn('text-xs', priorityConfig.color)}>
                              {priorityConfig.label}
                            </Badge>
                          </div>

                          <div className="text-xs text-gray-500 mb-2">
                            {project.code} • {project.department}
                          </div>

                          {showProjectDetails && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <Badge className={cn('text-xs', statusConfig.color)}>
                                  {statusConfig.label}
                                </Badge>
                                <span className="text-gray-500">{project.progress}% complete</span>
                              </div>

                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{project.manager}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>${(project.budget / 1000).toFixed(0)}k</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects found</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectFilter;
