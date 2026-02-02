import React from 'react';
import { Container } from 'react-bootstrap';

const Overview: React.FC = () => {
    return (
        <div className="overview-container text-center">
            <Container>
                <h1 className="placeholder-title mb-4">RPi Price Explorer</h1>
                <p className="subtitle mb-5" style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
                    Welcome to the Raspberry Pi Pricing & Forecasting Tool. This dashboard allows you to analyze historical price trends of RPi modules, break down their bill of materials (BOM), and project future costs based on market shifts in DRAM and EMMC components.
                </p>
                <p className="subtitle mb-5" style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
                    This tool is intended for informational purposes only and does not constitute financial advice. All data is sourced from public sources and is subject to change. Use with caution.
                </p>


                <div className="mt-5">
                    <p className="footer-hint">The geometric mean is used to de-compound the monthly inflation values from the selected Year-over-Year (YoY) period.</p>
                    <p className="footer-hint">To manually adjust the monthly inflation values used for projections, use the controls above.</p>
                    <p className="footer-hint"> WARNING: DRAM and EMMC prices are currently fabricated. This tool is for demonstration purposes only.</p>
                </div>
            </Container>
        </div>
    );
};

export default Overview;
