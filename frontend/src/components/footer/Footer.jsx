import React from 'react'

export default function Footer() {
  return (
    <footer className='w-full py-8 mt-12 border-t border-gray-200'>
      <div className='max-w-7xl mx-auto px-6 text-center text-sm text-gray-600'>
        © {new Date().getFullYear()} BeLiv. All rights reserved.
      </div>
    </footer>
  )
}
