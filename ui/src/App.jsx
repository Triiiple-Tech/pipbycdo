import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Button from './components/Button';
import Card from './components/Card';
import Modal from './components/Modal';
import FileUpload from './components/FileUpload';
import Footer from './components/Footer';
import MobileMenuToggle from './components/MobileMenuToggle';
import FilesTab from './components/FilesTab';
import ToastContainer from './components/Toast';
import { useToasts } from './hooks/useToasts';
import {
  Upload,
  BarChart3,
  Zap,
  FileText,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

function App() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const { toasts, addToast, removeToast } = useToasts();

  const handleFilesSelected = files => {
    console.log('Files selected:', files);
    // Here you would typically upload files to your backend
    // For demo purposes, let's show a brief loading state
    setIsUploadModalOpen(false);

    // Show success toast
    addToast(
      `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
      'success'
    );

    // In a real app, you'd process the files here
  };

  const handleNavigation = tab => {
    setActiveTab(tab);
    console.log('Navigating to:', tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'files':
        return <FilesTab />;
      case 'projects':
        return (
          <div className="space-y-8">
            <Card
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              padding="p-12"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
                  <TrendingUp className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Projects Dashboard
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Manage and track your construction projects with comprehensive
                  analytics and reporting.
                </p>
              </div>
            </Card>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-8">
            <Card
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              padding="p-12"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Help & Documentation
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Find guides, tutorials, and support resources to get the most
                  out of your CDO platform.
                </p>
              </div>
            </Card>
          </div>
        );
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Hero Section - Premium Card Design */}
      <Card
        className="mb-12 bg-white/70 backdrop-blur-sm border-0 shadow-xl"
        padding="p-12"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome to your intelligent dashboard
              </h2>
              <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
                Upload construction documents, analyze project data, and unlock
                AI-powered insights that drive efficiency and success.
              </p>
            </div>
            <div className="flex gap-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-8 py-4 text-base font-medium"
              >
                <Upload className="w-5 h-5 mr-3" />
                Upload Documents
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-base font-medium"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                View Analytics
              </Button>
            </div>
          </div>
          <div className="hidden lg:block ml-12">
            <div className="w-32 h-32 bg-gradient-to-br from-cdo-red via-red-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white font-bold text-3xl tracking-wide">
                CDO
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          padding="p-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Documents
              </p>
              <p className="text-2xl font-bold text-gray-900">247</p>
            </div>
          </div>
        </Card>
        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          padding="p-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
          </div>
        </Card>
        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          padding="p-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Insights
              </p>
              <p className="text-2xl font-bold text-gray-900">1.2k</p>
            </div>
          </div>
        </Card>
        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          padding="p-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-cdo-red" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Efficiency
              </p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Grid - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer"
          padding="p-10"
        >
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                Document Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Upload and analyze construction documents with AI-powered
                insights that transform raw data into actionable intelligence.
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer"
          padding="p-10"
        >
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">
                Project Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Track project progress in real-time and generate comprehensive
                reports that drive informed decision-making.
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer"
          padding="p-10"
        >
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                Smart Insights
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Get intelligent recommendations and automated workflows that
                optimize efficiency and reduce costs.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MobileMenuToggle
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <Sidebar active={activeTab} onNav={handleNavigation} />

      {/* Main content area with proper spacing for sidebar */}
      <main className="ml-20 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-12 py-12">
          {/* Header Section with generous spacing */}
          <header className="mb-12">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                CDO Construction Intelligence
              </h1>
              <p className="text-xl text-gray-600 font-medium max-w-2xl">
                Premium SaaS platform for construction data analysis and project
                intelligence
              </p>
            </div>
          </header>

          {/* Dynamic Content Based on Active Tab */}
          <div key={activeTab} className="animate-fadeIn">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Construction Documents"
      >
        <FileUpload onFilesSelected={handleFilesSelected} />
      </Modal>
    </div>
  );
}

export default App;
