"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface FormattedMessageContentProps {
  content: string
  isUser?: boolean
}

export function FormattedMessageContent({ content, isUser = false }: FormattedMessageContentProps) {
  // Custom components for markdown rendering
  const components = {
    // Code blocks
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      
      if (inline) {
        return (
          <code
            className={`px-1.5 py-0.5 rounded text-xs font-mono ${
              isUser 
                ? 'bg-white/20 text-white' 
                : 'bg-muted text-muted-foreground border'
            }`}
            {...props}
          >
            {children}
          </code>
        )
      }
      
      return (
        <div className="my-4">
          {language && (
            <div className={`px-3 py-1 text-xs font-medium rounded-t-lg border-b ${
              isUser 
                ? 'bg-white/10 text-white/70 border-white/20' 
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              {language}
            </div>
          )}
          <pre
            className={`p-4 rounded-lg overflow-x-auto text-sm ${
              language ? 'rounded-t-none' : ''
            } ${
              isUser 
                ? 'bg-white/10 text-white' 
                : 'bg-muted text-foreground border border-border'
            }`}
          >
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      )
    },

    // Pre blocks (to handle cases where pre is used directly)
    pre: ({ children, ...props }: any) => {
      return (
        <div className="my-4">
          <pre
            className={`p-4 rounded-lg overflow-x-auto text-sm ${
              isUser 
                ? 'bg-white/10 text-white' 
                : 'bg-muted text-foreground border border-border'
            }`}
            {...props}
          >
            {children}
          </pre>
        </div>
      )
    },
    
    // Headings
    h1: ({ children }: any) => (
      <h1 className={`text-xl font-bold mb-3 mt-4 ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className={`text-lg font-semibold mb-2 mt-3 ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className={`text-base font-medium mb-2 mt-3 ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </h3>
    ),
    
    // Lists
    ul: ({ children }: any) => (
      <ul className={`list-disc list-inside space-y-1 my-3 ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className={`list-decimal list-inside space-y-1 my-3 ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className={`ml-2 ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </li>
    ),
    
    // Paragraphs
    p: ({ children }: any) => {
      // Check if children contains block-level elements that shouldn't be in a paragraph
      const hasBlockElements = React.Children.toArray(children).some((child: any) => {
        if (React.isValidElement(child)) {
          const type = child.type;
          // Check if it's a block-level element or our custom components that render block elements
          return typeof type === 'string' && ['div', 'pre', 'blockquote', 'ul', 'ol', 'table'].includes(type);
        }
        return false;
      });

      // If it contains block elements, render as a div instead of p
      if (hasBlockElements) {
        return (
          <div className={`mb-3 leading-relaxed ${
            isUser ? 'text-white' : 'text-foreground'
          }`}>
            {children}
          </div>
        );
      }

      return (
        <p className={`mb-3 leading-relaxed ${
          isUser ? 'text-white' : 'text-foreground'
        }`}>
          {children}
        </p>
      );
    },
    
    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className={`border-l-4 pl-4 my-3 italic ${
        isUser 
          ? 'border-white/30 text-white/90' 
          : 'border-border text-muted-foreground'
      }`}>
        {children}
      </blockquote>
    ),
    
    // Tables
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto">
        <table className={`min-w-full border-collapse ${
          isUser ? 'border-white/20' : 'border-border'
        }`}>
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className={`border px-3 py-2 text-left font-medium ${
        isUser 
          ? 'border-white/20 bg-white/10 text-white' 
          : 'border-border bg-muted text-foreground'
      }`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className={`border px-3 py-2 ${
        isUser 
          ? 'border-white/20 text-white' 
          : 'border-border text-foreground'
      }`}>
        {children}
      </td>
    ),
    
    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:no-underline ${
          isUser 
            ? 'text-white hover:text-white/80' 
            : 'text-primary hover:text-primary/80'
        }`}
      >
        {children}
      </a>
    ),
    
    // Strong/Bold
    strong: ({ children }: any) => (
      <strong className={`font-semibold ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </strong>
    ),
    
    // Emphasis/Italic
    em: ({ children }: any) => (
      <em className={`italic ${
        isUser ? 'text-white' : 'text-foreground'
      }`}>
        {children}
      </em>
    ),
    
    // Horizontal rule
    hr: () => (
      <hr className={`my-4 ${
        isUser ? 'border-white/20' : 'border-border'
      }`} />
    ),
  }

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
