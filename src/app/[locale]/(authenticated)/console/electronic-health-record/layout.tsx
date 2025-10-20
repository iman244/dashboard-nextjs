import React from 'react'
import Provider from './provider'

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
      <Provider>
        {children}
      </Provider>
  )
}

export default Layout