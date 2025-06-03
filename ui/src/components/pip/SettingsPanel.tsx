import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Key,
  Globe,
  User,
  Monitor,
  Code,
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  Moon,
  Sun,
  Laptop,
  Volume2,
  VolumeX,
  Mail,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SettingsPanel({ isOpen, onClose, className }: SettingsPanelProps) {
  const {
    settings,
    updateTheme,
    updateNotifications,
    updatePrivacy,
    updateApiKeys,
    updateLanguage,
    updateProfile,
    updateWorkspace,
    updateDeveloper,
    resetSettings,
    exportSettings,
    importSettings,
    isDirty,
  } = useUserSettings();

  const [activeTab, setActiveTab] = useState('theme');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExportSettings = () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pip-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importSettings(text);
      if (success) {
        setImportError(null);
        // Show success message briefly
        setCopySuccess('Settings imported successfully!');
        setTimeout(() => setCopySuccess(null), 3000);
      } else {
        setImportError('Invalid settings file format');
      }
    } catch (error) {
      setImportError('Failed to read settings file');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${label} copied!`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-slate-900 shadow-2xl",
          "border-l border-slate-200 dark:border-slate-700",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Settings & Preferences
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Customize your experience and preferences
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="theme" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="apikeys" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="workspace" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Workspace
                </TabsTrigger>
                <TabsTrigger value="developer" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Developer
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  
                  {/* Theme Settings */}
                  <TabsContent value="theme" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          Appearance
                        </CardTitle>
                        <CardDescription>
                          Customize the visual appearance of your interface
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Theme Mode */}
                        <div className="space-y-3">
                          <Label>Theme Mode</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'light', label: 'Light', icon: Sun },
                              { value: 'dark', label: 'Dark', icon: Moon },
                              { value: 'system', label: 'System', icon: Laptop },
                            ].map(({ value, label, icon: Icon }) => (
                              <Button
                                key={value}
                                variant={settings.theme.mode === value ? 'default' : 'outline'}
                                className="flex items-center gap-2 h-16"
                                onClick={() => updateTheme({ mode: value as any })}
                              >
                                <Icon className="w-4 h-4" />
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Accent Color */}
                        <div className="space-y-3">
                          <Label>Accent Color</Label>
                          <div className="grid grid-cols-5 gap-3">
                            {[
                              { value: 'cdo-red', label: 'CDO Red', color: 'bg-red-500' },
                              { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
                              { value: 'green', label: 'Green', color: 'bg-green-500' },
                              { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
                              { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
                            ].map(({ value, label, color }) => (
                              <Button
                                key={value}
                                variant={settings.theme.accent === value ? 'default' : 'outline'}
                                className="flex flex-col items-center gap-2 h-16"
                                onClick={() => updateTheme({ accent: value as any })}
                              >
                                <div className={cn("w-4 h-4 rounded-full", color)} />
                                <span className="text-xs">{label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Font Size */}
                        <div className="space-y-3">
                          <Label>Font Size</Label>
                          <Select
                            value={settings.theme.fontSize}
                            onValueChange={(value) => updateTheme({ fontSize: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small (14px)</SelectItem>
                              <SelectItem value="medium">Medium (16px)</SelectItem>
                              <SelectItem value="large">Large (18px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* Accessibility */}
                        <div className="space-y-4">
                          <Label>Accessibility</Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>High Contrast Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                  Increase contrast for better visibility
                                </p>
                              </div>
                              <Switch
                                checked={settings.theme.highContrast}
                                onCheckedChange={(checked) => updateTheme({ highContrast: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Reduced Motion</Label>
                                <p className="text-sm text-muted-foreground">
                                  Minimize animations and transitions
                                </p>
                              </div>
                              <Switch
                                checked={settings.theme.reducedMotion}
                                onCheckedChange={(checked) => updateTheme({ reducedMotion: checked })}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Notification Settings */}
                  <TabsContent value="notifications" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>
                          Control when and how you receive notifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Master Enable */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enable Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Turn notifications on or off globally
                            </p>
                          </div>
                          <Switch
                            checked={settings.notifications.enabled}
                            onCheckedChange={(checked) => updateNotifications({ enabled: checked })}
                          />
                        </div>

                        <Separator />

                        {/* Notification Types */}
                        <div className="space-y-4 opacity-100" style={{ opacity: settings.notifications.enabled ? 1 : 0.5 }}>
                          <Label>Notification Types</Label>
                          <div className="space-y-3">
                            {[
                              { key: 'sound', label: 'Sound Effects', desc: 'Play sounds for notifications', icon: Volume2 },
                              { key: 'desktop', label: 'Desktop Notifications', desc: 'Show browser notifications', icon: Monitor },
                              { key: 'email', label: 'Email Notifications', desc: 'Send email alerts', icon: Mail },
                              { key: 'agentUpdates', label: 'Agent Updates', desc: 'Notifications when agents complete tasks', icon: Zap },
                              { key: 'projectProgress', label: 'Project Progress', desc: 'Updates on project milestones', icon: RefreshCw },
                              { key: 'costAlerts', label: 'Cost Alerts', desc: 'Notifications about spending thresholds', icon: Bell },
                              { key: 'systemMaintenance', label: 'System Maintenance', desc: 'Alerts about system updates', icon: Settings },
                            ].map(({ key, label, desc, icon: Icon }) => (
                              <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <Label>{label}</Label>
                                    <p className="text-sm text-muted-foreground">{desc}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings.notifications[key as keyof typeof settings.notifications] as boolean}
                                  onCheckedChange={(checked) => 
                                    updateNotifications({ [key]: checked })
                                  }
                                  disabled={!settings.notifications.enabled}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Privacy Settings */}
                  <TabsContent value="privacy" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Privacy & Data
                        </CardTitle>
                        <CardDescription>
                          Control your data privacy and sharing preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Data Sharing */}
                        <div className="space-y-4">
                          <Label>Data Sharing</Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Share Usage Analytics</Label>
                                <p className="text-sm text-muted-foreground">
                                  Help improve PIP by sharing anonymous usage data
                                </p>
                              </div>
                              <Switch
                                checked={settings.privacy.shareUsageAnalytics}
                                onCheckedChange={(checked) => updatePrivacy({ shareUsageAnalytics: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Allow Cookies</Label>
                                <p className="text-sm text-muted-foreground">
                                  Enable cookies for better user experience
                                </p>
                              </div>
                              <Switch
                                checked={settings.privacy.allowCookies}
                                onCheckedChange={(checked) => updatePrivacy({ allowCookies: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Opt-out of Tracking</Label>
                                <p className="text-sm text-muted-foreground">
                                  Disable behavioral tracking and analytics
                                </p>
                              </div>
                              <Switch
                                checked={settings.privacy.trackingOptOut}
                                onCheckedChange={(checked) => updatePrivacy({ trackingOptOut: checked })}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Data Retention */}
                        <div className="space-y-3">
                          <Label>Data Retention Period</Label>
                          <Select
                            value={settings.privacy.dataRetention}
                            onValueChange={(value) => updatePrivacy({ dataRetention: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                              <SelectItem value="365">1 year</SelectItem>
                              <SelectItem value="indefinite">Indefinite</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            How long to keep your chat history and data
                          </p>
                        </div>

                        <Separator />

                        {/* Data Export */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Data Export</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow export of your personal data
                            </p>
                          </div>
                          <Switch
                            checked={settings.privacy.exportable}
                            onCheckedChange={(checked) => updatePrivacy({ exportable: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* API Keys */}
                  <TabsContent value="apikeys" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Key className="w-5 h-5" />
                          API Key Management
                        </CardTitle>
                        <CardDescription>
                          Configure your AI model API keys for enhanced functionality
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label>Show API Keys</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKeys(!showApiKeys)}
                          >
                            {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showApiKeys ? 'Hide' : 'Show'}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {[
                            { key: 'openai', label: 'OpenAI API Key', placeholder: 'sk-...' },
                            { key: 'anthropic', label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
                            { key: 'google', label: 'Google AI API Key', placeholder: 'AIza...' },
                            { key: 'azure', label: 'Azure OpenAI API Key', placeholder: 'your-azure-key' },
                          ].map(({ key, label, placeholder }) => (
                            <div key={key} className="space-y-2">
                              <Label>{label}</Label>
                              <div className="flex gap-2">
                                <Input
                                  type={showApiKeys ? 'text' : 'password'}
                                  placeholder={placeholder}
                                  value={settings.apiKeys[key as keyof typeof settings.apiKeys] as string || ''}
                                  onChange={(e) => updateApiKeys({ [key]: e.target.value })}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(
                                    settings.apiKeys[key as keyof typeof settings.apiKeys] as string || '',
                                    label
                                  )}
                                  disabled={!settings.apiKeys[key as keyof typeof settings.apiKeys]}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 mb-2">
                            <Shield className="w-4 h-4" />
                            <span className="font-medium">Security Notice</span>
                          </div>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            API keys are stored locally in your browser and never transmitted to our servers. 
                            Keep your keys secure and never share them with others.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Language Settings */}
                  <TabsContent value="language" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Language & Region
                        </CardTitle>
                        <CardDescription>
                          Configure language, date, time, and currency preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Interface Language */}
                        <div className="space-y-3">
                          <Label>Interface Language</Label>
                          <Select
                            value={settings.language.interface}
                            onValueChange={(value) => updateLanguage({ interface: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                              <SelectItem value="pt">Português</SelectItem>
                              <SelectItem value="ja">日本語</SelectItem>
                              <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* Date & Time */}
                        <div className="space-y-4">
                          <Label>Date & Time Format</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Date Format</Label>
                              <Select
                                value={settings.language.dateFormat}
                                onValueChange={(value) => updateLanguage({ dateFormat: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Time Format</Label>
                              <Select
                                value={settings.language.timeFormat}
                                onValueChange={(value) => updateLanguage({ timeFormat: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="12h">12 Hour</SelectItem>
                                  <SelectItem value="24h">24 Hour</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Currency */}
                        <div className="space-y-3">
                          <Label>Currency</Label>
                          <Select
                            value={settings.language.currency}
                            onValueChange={(value) => updateLanguage({ currency: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* Timezone */}
                        <div className="space-y-3">
                          <Label>Timezone</Label>
                          <Input
                            value={settings.language.timezone}
                            onChange={(e) => updateLanguage({ timezone: e.target.value })}
                            placeholder="Auto-detected timezone"
                          />
                          <p className="text-sm text-muted-foreground">
                            Current: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Profile Settings */}
                  <TabsContent value="profile" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Profile Information
                        </CardTitle>
                        <CardDescription>
                          Manage your personal profile and public information
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                              placeholder="Your full name"
                              value={settings.profile.name}
                              onChange={(e) => updateProfile({ name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              value={settings.profile.email}
                              onChange={(e) => updateProfile({ email: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                              placeholder="Your job title"
                              value={settings.profile.title}
                              onChange={(e) => updateProfile({ title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Organization</Label>
                            <Input
                              placeholder="Your organization"
                              value={settings.profile.organization}
                              onChange={(e) => updateProfile({ organization: e.target.value })}
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Bio */}
                        <div className="space-y-2">
                          <Label>Bio</Label>
                          <Textarea
                            placeholder="Tell us a bit about yourself..."
                            value={settings.profile.bio}
                            onChange={(e) => updateProfile({ bio: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <Separator />

                        {/* Avatar */}
                        <div className="space-y-3">
                          <Label>Avatar URL</Label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                              {settings.profile.avatar ? (
                                <img
                                  src={settings.profile.avatar}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="https://example.com/avatar.jpg"
                                value={settings.profile.avatar}
                                onChange={(e) => updateProfile({ avatar: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Privacy */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Online Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Display when you're active to other users
                            </p>
                          </div>
                          <Switch
                            checked={settings.profile.showOnlineStatus}
                            onCheckedChange={(checked) => updateProfile({ showOnlineStatus: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Workspace Settings */}
                  <TabsContent value="workspace" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Monitor className="w-5 h-5" />
                          Workspace Preferences
                        </CardTitle>
                        <CardDescription>
                          Customize your workspace layout and behavior
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Default View */}
                        <div className="space-y-3">
                          <Label>Default View</Label>
                          <Select
                            value={settings.workspace.defaultView}
                            onValueChange={(value) => updateWorkspace({ defaultView: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chat">Chat Interface</SelectItem>
                              <SelectItem value="projects">Projects Dashboard</SelectItem>
                              <SelectItem value="dashboard">Analytics Dashboard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* Interface Options */}
                        <div className="space-y-4">
                          <Label>Interface Options</Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Collapse Sidebar by Default</Label>
                                <p className="text-sm text-muted-foreground">
                                  Start with a collapsed sidebar for more space
                                </p>
                              </div>
                              <Switch
                                checked={settings.workspace.sidebarCollapsed}
                                onCheckedChange={(checked) => updateWorkspace({ sidebarCollapsed: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Show Agent Status</Label>
                                <p className="text-sm text-muted-foreground">
                                  Display real-time agent status in sidebar
                                </p>
                              </div>
                              <Switch
                                checked={settings.workspace.showAgentStatus}
                                onCheckedChange={(checked) => updateWorkspace({ showAgentStatus: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Auto-save Chats</Label>
                                <p className="text-sm text-muted-foreground">
                                  Automatically save chat conversations
                                </p>
                              </div>
                              <Switch
                                checked={settings.workspace.autoSaveChats}
                                onCheckedChange={(checked) => updateWorkspace({ autoSaveChats: checked })}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Limits */}
                        <div className="space-y-4">
                          <Label>Storage Limits</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Chat History Limit</Label>
                              <Select
                                value={settings.workspace.chatHistoryLimit.toString()}
                                onValueChange={(value) => updateWorkspace({ chatHistoryLimit: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="50">50 messages</SelectItem>
                                  <SelectItem value="100">100 messages</SelectItem>
                                  <SelectItem value="500">500 messages</SelectItem>
                                  <SelectItem value="1000">1000 messages</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">File Upload Limit (MB)</Label>
                              <Select
                                value={settings.workspace.fileUploadLimit.toString()}
                                onValueChange={(value) => updateWorkspace({ fileUploadLimit: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10 MB</SelectItem>
                                  <SelectItem value="25">25 MB</SelectItem>
                                  <SelectItem value="50">50 MB</SelectItem>
                                  <SelectItem value="100">100 MB</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Developer Settings */}
                  <TabsContent value="developer" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="w-5 h-5" />
                          Developer Options
                        </CardTitle>
                        <CardDescription>
                          Advanced settings for developers and power users
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Debug Options */}
                        <div className="space-y-4">
                          <Label>Debug & Logging</Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Enable Debug Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                  Show additional debugging information
                                </p>
                              </div>
                              <Switch
                                checked={settings.developer.enableDebugMode}
                                onCheckedChange={(checked) => updateDeveloper({ enableDebugMode: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Show API Logs</Label>
                                <p className="text-sm text-muted-foreground">
                                  Display API request/response logs in console
                                </p>
                              </div>
                              <Switch
                                checked={settings.developer.showApiLogs}
                                onCheckedChange={(checked) => updateDeveloper({ showApiLogs: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Experimental Features</Label>
                                <p className="text-sm text-muted-foreground">
                                  Enable beta and experimental functionality
                                </p>
                              </div>
                              <Switch
                                checked={settings.developer.enableExperimentalFeatures}
                                onCheckedChange={(checked) => updateDeveloper({ enableExperimentalFeatures: checked })}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Log Level */}
                        <div className="space-y-3">
                          <Label>Log Level</Label>
                          <Select
                            value={settings.developer.logLevel}
                            onValueChange={(value) => updateDeveloper({ logLevel: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="error">Error</SelectItem>
                              <SelectItem value="warn">Warning</SelectItem>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="debug">Debug</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* Custom CSS */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Custom CSS</Label>
                            <Switch
                              checked={settings.developer.customCssEnabled}
                              onCheckedChange={(checked) => updateDeveloper({ customCssEnabled: checked })}
                            />
                          </div>
                          <Textarea
                            placeholder="/* Add your custom CSS here */"
                            value={settings.developer.customCss}
                            onChange={(e) => updateDeveloper({ customCss: e.target.value })}
                            rows={6}
                            disabled={!settings.developer.customCssEnabled}
                            className="font-mono text-sm"
                          />
                        </div>

                        <Separator />

                        {/* API Endpoint */}
                        <div className="space-y-3">
                          <Label>Custom API Endpoint</Label>
                          <Input
                            placeholder="https://api.example.com"
                            value={settings.developer.apiEndpoint}
                            onChange={(e) => updateDeveloper({ apiEndpoint: e.target.value })}
                          />
                          <p className="text-sm text-muted-foreground">
                            Override the default API endpoint (leave blank for default)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSettings}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  style={{ display: 'none' }}
                  id="import-settings"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-settings')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Settings
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetSettings}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
          
          {/* Status Messages */}
          <AnimatePresence>
            {copySuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">{copySuccess}</span>
              </motion.div>
            )}
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">{importError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}