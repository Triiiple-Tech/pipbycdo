"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FileSelectionFile {
  id: string
  name: string
  size: string
  type: 'pdf' | 'xlsx' | 'docx' | 'unknown'
  icon: string
}

interface FileSelectionState {
  selectedFiles: string[]
  additionalText: string
  action: 'analyze_selected' | 'analyze_all' | 'cancel'
}

interface FileSelectionCardProps {
  files: FileSelectionFile[]
  sheetId: string
  onSubmit: (selection: FileSelectionState) => void
}

export function FileSelectionCard({ files, sheetId, onSubmit }: FileSelectionCardProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [additionalText, setAdditionalText] = useState('')

  const handleFileToggle = (fileName: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileName])
    } else {
      setSelectedFiles(prev => prev.filter(name => name !== fileName))
    }
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(f => f.name))
    }
  }

  const handleSubmit = (action: 'analyze_selected' | 'analyze_all') => {
    onSubmit({
      selectedFiles: action === 'analyze_all' ? files.map(f => f.name) : selectedFiles,
      additionalText,
      action
    })
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Smartsheet Files Retrieved
        </CardTitle>
        <CardDescription>
          Sheet ID: <code className="bg-gray-100 px-1 rounded text-xs">{sheetId}</code> • {files.length} files available
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Select All Toggle */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedFiles.length === files.length && files.length > 0}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select All ({selectedFiles.length}/{files.length})
            </Label>
          </div>
        </div>

        {/* File Selection Grid */}
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedFiles.includes(file.name)}
                onCheckedChange={(checked) => handleFileToggle(file.name, !!checked)}
                id={`file-${file.id}`}
              />
              <span className="text-lg" role="img" aria-label={file.type}>
                {file.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {file.size} • {file.type.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">
            Additional Analysis Instructions (Optional)
          </Label>
          <Textarea
            id="instructions"
            placeholder="e.g., Focus on cost estimation, analyze blueprints for electrical work..."
            value={additionalText}
            onChange={(e) => setAdditionalText(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={() => handleSubmit('analyze_selected')}
            disabled={selectedFiles.length === 0}
            className="flex-1 bg-gradient-to-r from-[#E60023] to-[#C4001A] hover:from-[#C4001A] hover:to-[#E60023]"
          >
            Analyze Selected ({selectedFiles.length})
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSubmit('analyze_all')}
            className="border-[#E60023] text-[#E60023] hover:bg-[#E60023] hover:text-white"
          >
            Analyze All
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setSelectedFiles([])}
            disabled={selectedFiles.length === 0}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
