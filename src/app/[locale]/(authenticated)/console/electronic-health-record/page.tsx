import { Metadata } from 'next'
import Client from './client'
import React from 'react'

export const metadata: Metadata = {
  title: 'Electronic Health Record',
  description: 'Electronic Health Record',
}

const Page = () => {
  return (
    <Client />
  )
}

export default Page