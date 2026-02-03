import { useState } from 'react'
import ReactFullpage from '@fullpage/react-fullpage'
import Overview from './components/Overview'
import Prices from './components/RPiPrices'
import ComponentPrices from './components/ComponentPrices'
import Breakdown from './components/Breakdown'
import Projections from './components/Projections'
import Map from './components/Map'
import './App.css'

function App() {
  const [selected_modules, setSelectedModules] = useState<any[]>([])
  const [ram_inf, setRamInf] = useState<number>(0)
  const [emmc_inf, setEmmcInf] = useState<number>(0)
  const [breakdown_result, setBreakdownResult] = useState<any[]>([])
  const [mapActive, setMapActive] = useState<boolean>(false)

  const NavArrow = ({ direction, label, onClick }: { direction: 'up' | 'down'; label: string; onClick: () => void }) => (
    <div className={`nav-arrow-container ${direction}`} onClick={onClick}>
      <span className="nav-label">{label}</span>
      <div className={`arrow ${direction}`}></div>
    </div>
  )

  return (
    <ReactFullpage
      licenseKey={'OPEN-SOURCE-GPLV3-LICENSE'}
      credits={{ enabled: true, label: 'Fullpage.js', position: 'right' }}
      scrollingSpeed={500}
      navigation={true}
      navigationPosition={'right'}
      autoScrolling={true}
      fitToSection={true}
      afterRender={() => {
        // Disable automatic scrolling (mouse wheel and swipes)
        // @ts-ignore
        if (window.fullpage_api) {
          // @ts-ignore
          window.fullpage_api.setAllowScrolling(false);
        }
      }}
      render={({ fullpageApi }) => {
        return (
          <ReactFullpage.Wrapper>
            {/* Section 1: Overview */}
            <div className="section" data-anchor="overview">
              <div className="section-content flex-center">
                <Overview />
                <NavArrow
                  direction="down"
                  label="RPi Prices"
                  onClick={() => fullpageApi.moveSectionDown()}
                />
              </div>
            </div>

            {/* Section 2: RPi Cost */}
            <div className="section" data-anchor="rpi-cost">
              <div className="section-content">
                <NavArrow
                  direction="up"
                  label="Overview"
                  onClick={() => fullpageApi.moveSectionUp()}
                />
                <Prices setSelectedModules={setSelectedModules} />
                <NavArrow
                  direction="down"
                  label="Component Prices"
                  onClick={() => fullpageApi.moveSectionDown()}
                />
              </div>
            </div>

            {/* Section 3: Component Cost */}
            <div className="section" data-anchor="component-cost">
              <div className="section-content">
                <NavArrow
                  direction="up"
                  label="RPi Prices"
                  onClick={() => fullpageApi.moveSectionUp()}
                />
                <ComponentPrices
                  selected_modules={selected_modules}
                />
                <NavArrow
                  direction="down"
                  label="Breakdown"
                  onClick={() => fullpageApi.moveSectionDown()}
                />
              </div>
            </div>

            {/* Section 4: Breakdown */}
            <div className="section" data-anchor="breakdown">
              <div className="section-content flex-center">
                <NavArrow
                  direction="up"
                  label="Component Prices"
                  onClick={() => fullpageApi.moveSectionUp()}
                />
                <Breakdown
                  selected_modules={selected_modules}
                  ram_inf={ram_inf}
                  emmc_inf={emmc_inf}
                  setRamInf={setRamInf}
                  setEmmcInf={setEmmcInf}
                  setBreakdownResult={setBreakdownResult}
                />
                <NavArrow
                  direction="down"
                  label="Projections"
                  onClick={() => fullpageApi.moveSectionDown()}
                />
              </div>
            </div>

            {/* Section 5: Projections */}
            <div className="section" data-anchor="projections">
              <div className="section-content flex-center">
                <NavArrow
                  direction="up"
                  label="Breakdown"
                  onClick={() => fullpageApi.moveSectionUp()}
                />
                <Projections ram_inf={ram_inf} emmc_inf={emmc_inf} breakdown_result={breakdown_result} />
                <NavArrow
                  direction="down"
                  label="Get yours now"
                  onClick={() => { fullpageApi.moveSectionDown(); setMapActive(true) }}
                />
              </div>
            </div>

            {/* Section 6: Map */}
            <div className="section" data-anchor="map">
              <div className="section-content flex-center">
                <NavArrow
                  direction="up"
                  label="Projections"
                  onClick={() => fullpageApi.moveSectionUp()}
                />
                <Map isActive={mapActive} />
              </div>
            </div>
          </ReactFullpage.Wrapper>
        )
      }}
    />
  )
}

export default App
