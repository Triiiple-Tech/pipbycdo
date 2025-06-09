"use client"

import React, { useState, useEffect } from 'react'

export default function HookDebugTest() {
  const [counter, setCounter] = useState(0)
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  console.log("🧨 HookDebugTest rendering, counter:", counter)

  // Test basic useEffect
  useEffect(() => {
    console.log("🧨 Basic useEffect triggered!")
    setCounter(prev => prev + 1)
  }, [])

  // Test async useEffect with API call
  useEffect(() => {
    console.log("🧨 API useEffect triggered!")
    
    const fetchData = async () => {
      console.log("🧨 Starting fetch...")
      setLoading(true)
      
      try {
        const response = await fetch('http://localhost:8000/api/chat/sessions')
        console.log("🧨 Fetch response:", response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log("🧨 Fetch data:", data.length, "sessions")
          setApiData(data)
        }
      } catch (error) {
        console.error("🧨 Fetch error:", error)
      } finally {
        setLoading(false)
        console.log("🧨 Fetch complete")
      }
    }
    
    fetchData()
  }, [])

  console.log("🧨 HookDebugTest state - counter:", counter, "loading:", loading, "apiData length:", apiData?.length || 0)

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'red', 
      color: 'white', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div>Hook Debug Test</div>
      <div>Counter: {counter}</div>
      <div>Loading: {loading ? 'yes' : 'no'}</div>
      <div>Sessions: {apiData?.length || 0}</div>
    </div>
  )
}
