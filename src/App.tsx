import { Footer } from './components/Footer'
import { MikuCanvas } from './components/MikuCanvas'
import { PlayerProvider } from './contexts/PlayerContext'

function App() {
  return <div className="w-screen h-screen">
    <PlayerProvider>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <MikuCanvas />
        </div>
        <div className="flex-none">
          <Footer />
        </div>
      </div>
    </PlayerProvider>
  </div>
}

export default App
