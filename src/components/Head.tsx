import { useEffect } from 'react'

interface HeadProps {
  children: React.ReactNode
}

const Head: React.FC<HeadProps> = ({ children }) => {
  useEffect(() => {
    // Process children to extract title and meta tags
    const processChildren = (children: React.ReactNode) => {
      if (!children) return

      const childArray = Array.isArray(children) ? children : [children]
      
      childArray.forEach((child) => {
        if (child && typeof child === 'object' && 'type' in child) {
          const element = child as React.ReactElement
          
          if (element.type === 'title') {
            document.title = element.props.children
          } else if (element.type === 'meta') {
            const { name, property, content } = element.props
            if (name || property) {
              // Remove existing meta tag if it exists
              const existingMeta = document.querySelector(
                `meta[${name ? 'name' : 'property'}="${name || property}"]`
              )
              if (existingMeta) {
                existingMeta.remove()
              }
              
              // Add new meta tag
              const meta = document.createElement('meta')
              if (name) meta.setAttribute('name', name)
              if (property) meta.setAttribute('property', property)
              if (content) meta.setAttribute('content', content)
              document.head.appendChild(meta)
            }
          }
        }
      })
    }

    processChildren(children)
  }, [children])

  return null
}

export default Head
