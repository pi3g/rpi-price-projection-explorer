import React, { useState, useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import worldMapSvg from '../assets/world.svg?raw';
import resellerData from '../assets/dataset_resellers.json';
import pi3gLogo from '../assets/pi3g.png';

interface MapProps {
    isActive: boolean;
}

const Map: React.FC<MapProps> = ({ isActive }) => {
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [selectedResellers, setSelectedResellers] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showCTAModal, setShowCTAModal] = useState(true);

    // Tooltip State
    const [tooltipContent, setTooltipContent] = useState<string | null>(null);

    // Clean SVG string: remove XML declaration and comments if they exist
    // Inject viewBox to ensure the map scales correctly and isn't cut off
    const cleanedSvg = useMemo(() => {
        if (!worldMapSvg) return '';
        let svg = worldMapSvg
            .replace(/<\?xml.*?\?>/i, '')
            .replace(/<!--.*?-->/gs, '');

        // Inject viewBox for responsive behavior (based on width=1009.67 height=665.96)
        if (!svg.includes('viewBox')) {
            svg = svg.replace('<svg', '<svg viewBox="0 0 1010 640" preserveAspectRatio="xMidYMid meet"');
        }
        return svg;
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        // setTooltipPos({ x: e.clientX, y: e.clientY });

        const target = e.target as HTMLElement;
        const path = target.closest('path');

        if (path) {
            const title = path.getAttribute('title');
            if (title) {
                setTooltipContent(title);
                return;
            }
        }
        setTooltipContent(null);
    };

    const handleMouseLeave = () => {
        setTooltipContent(null);
    };

    const handleClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const path = target.closest('path');

        if (path) {
            const title = path.getAttribute('title');
            const className = path.getAttribute('class');
            const name = path.getAttribute('name');
            const id = path.getAttribute('id');

            const countryIdentifier = title || name || className || id;

            if (countryIdentifier) {
                setSelectedCountry(countryIdentifier);

                // Search dataset (case-insensitive)
                const matches = resellerData.filter(r =>
                    r.country.toLowerCase() === countryIdentifier.toLowerCase()
                );
                setSelectedResellers(matches);
                setShowModal(true);
            }
        }
    };

    const handleClose = () => setShowModal(false);

    return (
        <div className="map-inner-container w-100 flex-column d-flex align-items-center justify-content-center" style={{ marginTop: '2rem' }}>
            <div className="resellers-header mb-0 text-center">
                <h1 className="main-title mb-1" style={{ fontSize: '3rem', fontWeight: 'bold' }}>Resellers </h1>
                <p className="subtitle" style={{ fontSize: '1rem', color: '#888', opacity: 0.8 }}>
                    {tooltipContent || "Click on a country for local resellers"}
                </p>
            </div>

            <div
                className="map-wrapper shadow-lg rounded"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                style={{
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '1100px',
                    backgroundColor: 'rgba(255,255,255,0.01)',
                    borderRadius: '16px',
                    padding: '2.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative'
                }}
                dangerouslySetInnerHTML={{ __html: cleanedSvg }}
            />

            <Modal
                show={isActive && showCTAModal}
                onHide={() => setShowCTAModal(false)}
                centered
                size="lg"
                contentClassName="custom-reseller-modal"
            >
                <Modal.Header closeButton closeVariant="white" style={{ borderBottom: '1px solid #333' }}>
                    <Modal.Title style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>
                        Brought to you by Pi3G
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '60vh', overflowY: 'hidden', backgroundColor: '#111' }}>
                    <a href="https://pi3g.com/kontakt/" target="_blank" rel="noopener noreferrer">
                        <img
                            className="w-100"
                            style={{ maxHeight: '400px', objectFit: 'contain', cursor: 'pointer' }}
                            src={pi3gLogo}
                            alt="Pi3G Logo"
                        />
                    </a>
                </Modal.Body>
            </Modal>

            <Modal
                show={showModal}
                onHide={handleClose}
                centered
                size="lg"
                contentClassName="custom-reseller-modal"
            >
                <Modal.Header closeButton closeVariant="white" style={{ borderBottom: '1px solid #333' }}>
                    <Modal.Title style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>
                        Resellers in {selectedCountry}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto', backgroundColor: '#111' }}>
                    {selectedResellers.length > 0 ? (
                        <div className="reseller-list px-2">
                            {selectedResellers.map((reseller, idx) => (
                                <div key={idx} className="modal-reseller-entry mb-3 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #222' }}>
                                    <div style={{ color: '#646cff', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>
                                        {reseller.name}
                                    </div>
                                    <div className="d-flex flex-wrap align-items-center gap-4">
                                        <a
                                            href={reseller.site.startsWith('http') ? reseller.site : `https://${reseller.site}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="reseller-link d-flex align-items-center"
                                            style={{ color: '#fff', textDecoration: 'none', opacity: 0.8, fontSize: '0.95rem' }}
                                        >
                                            <span style={{ marginRight: '8px' }}>🌐</span>{reseller.site}
                                        </a>
                                        {reseller.phone && (
                                            <div style={{ color: '#888', fontSize: '0.9rem' }} className="d-flex align-items-center">
                                                <span style={{ marginRight: '8px' }}>📞</span>{reseller.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5" style={{ color: '#666', fontSize: '1.1rem' }}>
                            We couldn't find any specific resellers listed for {selectedCountry} in our database.
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #333', justifyContent: 'center' }}>
                    <Button
                        variant="primary"
                        onClick={handleClose}
                        style={{
                            padding: '10px 50px',
                            fontWeight: '600',
                            backgroundColor: '#646cff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 15px rgba(100, 108, 255, 0.3)'
                        }}
                    >
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .map-inner-container {
                    flex: 1;
                    height: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .map-wrapper svg {
                    width: 100%;
                    height: auto;
                    display: block;
                    max-height: 65vh; /* Increased slightly to balance overflow vs cut-off */
                }
                .map-wrapper path {
                    fill: #222;
                    stroke: #111;
                    stroke-width: 0.3;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .map-wrapper path:hover {
                    fill: #646cff !important;
                    stroke: #fff;
                    stroke-width: 0.8;
                    filter: brightness(1.2) drop-shadow(0 0 12px rgba(100, 108, 255, 0.5));
                    z-index: 10;
                }
                .main-title {
                    background: linear-gradient(to right, #fff, #999);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .custom-reseller-modal {
                    background-color: #111 !important;
                    border: 1px solid #333 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 0 40px rgba(0,0,0,0.8) !important;
                }
                .reseller-link:hover {
                    color: #646cff !important;
                    text-decoration: underline !important;
                    opacity: 1 !important;
                }
                .modal-reseller-entry {
                    transition: all 0.2s ease;
                }
                .modal-reseller-entry:hover {
                    border-color: #646cff !important;
                    background-color: rgba(100, 108, 255, 0.05) !important;
                    transform: translateY(-2px);
                }
                .modal-header .btn-close {
                    filter: invert(1) grayscale(100%) brightness(200%);
                }
            `}</style>
        </div>
    );
};

export default Map;