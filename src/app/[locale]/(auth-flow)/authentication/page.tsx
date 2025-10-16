import React from 'react'
import { Client } from './client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication",
}

const Page = () => {
  return (
    <Client />
  )
}

export default Page