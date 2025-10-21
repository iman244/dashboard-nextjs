import React from 'react'
import Client from './client'
import Provider from './provider'

const Page = () => {
  return (
    <Provider>
      <Client />
    </Provider>
  )
}

export default Page