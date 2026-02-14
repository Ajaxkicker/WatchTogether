import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Room from './pages/Room'

export default function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1a1a1a',
                        color: '#f5f5f5',
                        border: '1px solid #2e2e2e',
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room/:roomCode" element={<Room />} />
            </Routes>
        </BrowserRouter>
    )
}
