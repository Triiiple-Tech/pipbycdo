"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Users, BarChart3, Database, Plus, Edit, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Template {
  id: string
  name: string
  category: string
  prompt: string
  usage: number
  lastUsed: string
}

export function AdminPanel() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Project Analysis",
      category: "Analysis",
      prompt: "Analyze the uploaded project documents and provide a comprehensive overview...",
      usage: 156,
      lastUsed: "2 hours ago",
    },
    {
      id: "2",
      name: "Cost Estimation",
      category: "Estimation",
      prompt: "Based on the project scope, provide detailed cost estimates...",
      usage: 89,
      lastUsed: "1 day ago",
    },
  ])

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [newTemplate, setNewTemplate] = useState({ name: "", category: "", prompt: "" })

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t)))
      setEditingTemplate(null)
    } else {
      const template: Template = {
        id: Date.now().toString(),
        ...newTemplate,
        usage: 0,
        lastUsed: "Never",
      }
      setTemplates((prev) => [...prev, template])
      setNewTemplate({ name: "", category: "", prompt: "" })
    }
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <Badge variant="outline" className="text-[#E60023] border-[#E60023]">
            Administrator
          </Badge>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Template Management */}
            <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Template Management</h3>
                <Button className="bg-[#E60023] hover:bg-[#C4001A] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              <div className="space-y-4">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#E60023]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-white">{template.name}</h4>
                          <Badge variant="secondary">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-white/80 mb-3 line-clamp-2">{template.prompt}</p>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>Used {template.usage} times</span>
                          <span>Last used {template.lastUsed}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                          className="text-white/60 hover:text-[#E60023]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-white/60 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#E60023]/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-[#E60023]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">1,247</p>
                    <p className="text-sm text-white/80">Total Queries</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">89</p>
                    <p className="text-sm text-white/80">Active Users</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">456</p>
                    <p className="text-sm text-white/80">Files Processed</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* System Settings */}
            <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-6">System Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Default Model</label>
                  <Input
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                    defaultValue="gpt-4-turbo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Max File Size (MB)</label>
                  <Input
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                    defaultValue="50"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Session Timeout (minutes)</label>
                  <Input
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                    defaultValue="30"
                    type="number"
                  />
                </div>
                <Button className="bg-[#E60023] hover:bg-[#C4001A] text-white">Save Settings</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            {/* Audit Log */}
            <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-6">Audit Log</h3>
              <div className="space-y-3">
                {[
                  { action: "File Upload", user: "john.doe@company.com", time: "2 minutes ago", cost: "$0.15" },
                  { action: "Template Used", user: "jane.smith@company.com", time: "5 minutes ago", cost: "$0.08" },
                  { action: "Chat Export", user: "admin@company.com", time: "10 minutes ago", cost: "$0.02" },
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{log.action}</p>
                      <p className="text-sm text-white/80">{log.user}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{log.cost}</p>
                      <p className="text-xs text-white/60">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
