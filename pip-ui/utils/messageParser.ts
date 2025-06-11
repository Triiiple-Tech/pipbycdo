// Utility functions for parsing interactive content from agent messages

export interface FileSelectionMessage {
  type: 'file_selection'
  sheet_id: string
  files: Array<{
    id: string
    name: string
    size: string
    type: 'pdf' | 'xlsx' | 'docx' | 'unknown'
    icon: string
  }>
}

/**
 * Parse agent messages for interactive content
 * Looks for metadata in HTML comments: <!-- METADATA: {JSON} -->
 * Also looks for UI components: <ui-component type="file-picker">
 */
export function parseMessageForInteractivity(content: string): FileSelectionMessage | null {
  try {
    // First try HTML comment metadata
    const metadataMatch = content.match(/<!-- METADATA: ([\s\S]+?) -->/)
    
    if (metadataMatch) {
      const metadataJson = metadataMatch[1].trim()
      const metadata = JSON.parse(metadataJson)
      
      // Validate that it's a file selection message
      if (metadata.type === 'file_selection' && metadata.sheet_id && Array.isArray(metadata.files)) {
        return metadata as FileSelectionMessage
      }
    }
    
    // Try UI component format
    const uiComponentMatch = content.match(/<ui-component type="file-picker" sheet-id="([^"]+)" files-count="(\d+)">\s*([\s\S]*?)\s*<\/ui-component>/);
    
    if (uiComponentMatch) {
      const sheetId = uiComponentMatch[1]
      const filesData = uiComponentMatch[3].trim()
      
      try {
        const files = JSON.parse(filesData)
        if (Array.isArray(files)) {
          return {
            type: 'file_selection',
            sheet_id: sheetId,
            files: files.map(file => ({
              id: file.id || '',
              name: file.name || '',
              size: file.size || '',
              type: file.type as 'pdf' | 'xlsx' | 'docx' | 'unknown',
              icon: file.icon || '📎'
            }))
          }
        }
      } catch (parseError) {
        console.error('Failed to parse UI component files data:', parseError)
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to parse message metadata:', error)
    return null
  }
}

/**
 * Remove metadata from message content for display
 */
export function cleanMessageContent(content: string): string {
  return content
    .replace(/<!-- METADATA:[\s\S]*? -->/g, '')
    .replace(/<ui-component[\s\S]*?<\/ui-component>/g, '')
    .trim()
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'pdf':
      return '📄'
    case 'xlsx':
    case 'xls':
      return '📊'
    case 'docx':
    case 'doc':
      return '📝'
    default:
      return '📎'
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
