import React from 'react'

const Loading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Simple Spinner */}
        <div className="w-8 h-8 border-2 border-muted rounded-full animate-spin border-t-foreground"></div>
        
        {/* Loading Text */}
        {/* <p className="text-muted-foreground text-sm">Loading...</p> */}
      </div>
    </div>
  )
}

export default Loading