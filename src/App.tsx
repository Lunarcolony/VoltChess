import { Routes, Route } from 'react-router-dom'
import Layout from '@/sections/layout'

// Import pages (we'll need to convert these)
import Home from '@/pages/index'
import Analysis from '@/pages/analysis'
import Database from '@/pages/database'
import Login from '@/pages/login'
import Play from '@/pages/play'
import Reanalysis from '@/pages/reanalysis'
import Register from '@/pages/register'
import TermsAndConditions from '@/pages/terms-and-conditions'
import Thanks from '@/pages/thanks'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/database" element={<Database />} />
        <Route path="/login" element={<Login />} />
        <Route path="/play" element={<Play />} />
        <Route path="/reanalysis" element={<Reanalysis />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/thanks" element={<Thanks />} />
      </Routes>
    </Layout>
  )
}

export default App
