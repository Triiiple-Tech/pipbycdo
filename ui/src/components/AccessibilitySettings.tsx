import React from 'react';
import { Settings, Palette, Eye, Type, Zap, VolumeX, Keyboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAccessibility, ThemeMode, ColorBlindMode, FontSize, MotionPreference } from '@/contexts/AccessibilityContext';
import { cn } from '@/lib/utils';

interface AccessibilitySettingsProps {
  children?: React.ReactNode;
}

export function AccessibilitySettings({ children }: AccessibilitySettingsProps) {
  const { preferences, updatePreference, resetPreferences, announceToScreenReader } = useAccessibility();

  const handleReset = () => {
    resetPreferences();
    announceToScreenReader('All accessibility settings have been reset to defaults');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Open accessibility settings"
          >
            <Settings className="h-4 w-4" />
            Accessibility
          </Button>
        )}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[500px] overflow-y-auto"
        aria-describedby="accessibility-settings-description"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibility Settings
          </SheetTitle>
          <SheetDescription id="accessibility-settings-description">
            Customize the interface to meet your accessibility needs. Changes are saved automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme and Visual Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme & Visual
              </CardTitle>
              <CardDescription>
                Adjust visual appearance and contrast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-mode">Theme Mode</Label>
                <Select
                  value={preferences.themeMode}
                  onValueChange={(value: ThemeMode) => updatePreference('themeMode', value)}
                >
                  <SelectTrigger id="theme-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="high-contrast">High Contrast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="flex-1">
                  High Contrast Mode
                  <span className="block text-xs text-muted-foreground mt-1">
                    Increases contrast for better visibility
                  </span>
                </Label>
                <Switch
                  id="high-contrast"
                  checked={preferences.highContrast}
                  onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorblind-mode">Color Blind Support</Label>
                <Select
                  value={preferences.colorBlindMode}
                  onValueChange={(value: ColorBlindMode) => updatePreference('colorBlindMode', value)}
                >
                  <SelectTrigger id="colorblind-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Vision</SelectItem>
                    <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                    <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                    <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-transparency" className="flex-1">
                  Reduce Transparency
                  <span className="block text-xs text-muted-foreground mt-1">
                    Removes transparent backgrounds for clarity
                  </span>
                </Label>
                <Switch
                  id="reduced-transparency"
                  checked={preferences.reducedTransparency}
                  onCheckedChange={(checked) => updatePreference('reducedTransparency', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Typography Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </CardTitle>
              <CardDescription>
                Adjust text size and readability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={preferences.fontSize}
                  onValueChange={(value: FontSize) => updatePreference('fontSize', value)}
                >
                  <SelectTrigger id="font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Font size preview */}
              <div className="p-3 border rounded-md bg-muted/50">
                <p className={cn(
                  "transition-all duration-200",
                  preferences.fontSize === 'small' && "text-sm",
                  preferences.fontSize === 'medium' && "text-base",
                  preferences.fontSize === 'large' && "text-lg",
                  preferences.fontSize === 'extra-large' && "text-xl"
                )}>
                  Sample text at {preferences.fontSize} size
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Motion Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Motion & Animation
              </CardTitle>
              <CardDescription>
                Control animations and transitions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motion-preference">Motion Preference</Label>
                <Select
                  value={preferences.motionPreference}
                  onValueChange={(value: MotionPreference) => updatePreference('motionPreference', value)}
                >
                  <SelectTrigger id="motion-preference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="reduced">Reduced Motion</SelectItem>
                    <SelectItem value="none">No Motion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Screen Reader Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <VolumeX className="h-4 w-4" />
                Screen Reader
              </CardTitle>
              <CardDescription>
                Optimize for assistive technologies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="screen-reader-optimized" className="flex-1">
                  Screen Reader Optimized
                  <span className="block text-xs text-muted-foreground mt-1">
                    Adds extra context and descriptions
                  </span>
                </Label>
                <Switch
                  id="screen-reader-optimized"
                  checked={preferences.screenReaderOptimized}
                  onCheckedChange={(checked) => updatePreference('screenReaderOptimized', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="announce-changes" className="flex-1">
                  Announce Changes
                  <span className="block text-xs text-muted-foreground mt-1">
                    Announce setting changes to screen readers
                  </span>
                </Label>
                <Switch
                  id="announce-changes"
                  checked={preferences.announceChanges}
                  onCheckedChange={(checked) => updatePreference('announceChanges', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Keyboard & Focus Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard & Focus
              </CardTitle>
              <CardDescription>
                Improve keyboard navigation and focus visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enhanced-focus" className="flex-1">
                  Enhanced Focus Indicators
                  <span className="block text-xs text-muted-foreground mt-1">
                    Stronger focus rings for better visibility
                  </span>
                </Label>
                <Switch
                  id="enhanced-focus"
                  checked={preferences.enhancedFocus}
                  onCheckedChange={(checked) => updatePreference('enhancedFocus', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="skip-links" className="flex-1">
                  Skip Links
                  <span className="block text-xs text-muted-foreground mt-1">
                    Add skip navigation links
                  </span>
                </Label>
                <Switch
                  id="skip-links"
                  checked={preferences.skipLinks}
                  onCheckedChange={(checked) => updatePreference('skipLinks', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Reset Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reset Settings</p>
              <p className="text-xs text-muted-foreground">
                Restore all accessibility settings to defaults
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {preferences.highContrast && (
                  <Badge variant="secondary">High Contrast</Badge>
                )}
                {preferences.colorBlindMode !== 'normal' && (
                  <Badge variant="secondary">{preferences.colorBlindMode}</Badge>
                )}
                {preferences.fontSize !== 'medium' && (
                  <Badge variant="secondary">{preferences.fontSize} text</Badge>
                )}
                {preferences.motionPreference === 'reduced' && (
                  <Badge variant="secondary">Reduced Motion</Badge>
                )}
                {preferences.motionPreference === 'none' && (
                  <Badge variant="secondary">No Motion</Badge>
                )}
                {preferences.screenReaderOptimized && (
                  <Badge variant="secondary">Screen Reader</Badge>
                )}
                {preferences.reducedTransparency && (
                  <Badge variant="secondary">No Transparency</Badge>
                )}
                {Object.values(preferences).every(v => 
                  v === (defaultPreferences as any)[Object.keys(preferences)[Object.values(preferences).indexOf(v)]]
                ) && (
                  <Badge variant="outline">Default Settings</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Default preferences for comparison
const defaultPreferences = {
  themeMode: 'auto',
  colorBlindMode: 'normal',
  fontSize: 'medium',
  highContrast: false,
  motionPreference: 'auto',
  reducedTransparency: false,
  screenReaderOptimized: false,
  announceChanges: true,
  enhancedFocus: true,
  skipLinks: true,
};